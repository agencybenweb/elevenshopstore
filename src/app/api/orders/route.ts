import { NextRequest, NextResponse } from 'next/server';
import { orderFormSchema, isPostalCodeAllowed } from '@/lib/validation';
import { getProducts, getStoreSettings } from '@/lib/products';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { saveInMemoryOrder } from '@/lib/orders-store';
import { Order, OrderItem } from '@/types/database';
import { ensureTelegramPollerStarted } from '@/lib/telegram-poller';

// Simple IP rate limit cache: IP -> timestamp[]
const ipRateLimits = new Map<string, number[]>();
const MAX_ORDERS_PER_WINDOW = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRateLimits.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_ORDERS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  ipRateLimits.set(ip, validTimestamps);
  return true;
}

function generateOrderCode(): string {
  const letters = 'ELV';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${letters}-${digits}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            'Trop de commandes passées récemment depuis cette connexion. Veuillez patienter quelques minutes.',
        },
        { status: 429 }
      );
    }

    // 2. Parse JSON & Validate with Zod
    const body = await req.json();
    const parseResult = orderFormSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      const firstError = issues[0]?.message || 'Données de commande invalides.';
      return NextResponse.json({ error: firstError, details: parseResult.error }, { status: 400 });
    }

    const input = parseResult.data;

    // 3. Honeypot check
    if (input.honeypot && input.honeypot.length > 0) {
      // Fake success for bots
      return NextResponse.json({
        success: true,
        public_code: 'ELV-0000',
      });
    }

    // 4. Fetch store settings
    const settings = await getStoreSettings();

    // Check store opening status
    if (!settings.is_open) {
      return NextResponse.json(
        {
          error:
            settings.open_message ||
            'Le service de livraison est actuellement fermé. Revenez très bientôt !',
        },
        { status: 400 }
      );
    }

    // 5. Check postal code
    if (!isPostalCodeAllowed(input.postal_code, settings.allowed_postal_codes)) {
      return NextResponse.json(
        {
          error: `Désolé, nous ne livrons pas encore le code postal ${input.postal_code}. Zones couvertes : ${settings.allowed_postal_codes.join(
            ', '
          )}.`,
        },
        { status: 400 }
      );
    }

    // 6. Recalculate ALL prices on the server from database / source of truth
    const allProducts = await getProducts();
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    const validatedItems: OrderItem[] = [];
    let subtotalCents = 0;
    let hasAgeRestricted = false;

    for (const item of input.items) {
      const product = productMap.get(item.product_id);

      if (!product) {
        return NextResponse.json(
          { error: `Produit introuvable (ID: ${item.product_id}). Veuillez actualiser votre panier.` },
          { status: 400 }
        );
      }

      if (!product.is_available) {
        return NextResponse.json(
          {
            error: `Le produit « ${product.nom} » n'est plus disponible actuellement. Veuillez le retirer du panier.`,
          },
          { status: 400 }
        );
      }

      if (product.is_age_restricted) {
        hasAgeRestricted = true;
      }

      const itemTotal = product.price_cents * item.quantity;
      subtotalCents += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.nom,
        price_cents: product.price_cents,
        quantity: item.quantity,
      });
    }

    // 7. Check Age restriction confirmation
    if (hasAgeRestricted && !input.is_adult_confirmed) {
      return NextResponse.json(
        {
          error:
            'Des produits soumis à restriction d’âge (18+) sont présents dans votre commande. Vous devez certifier être majeur(e).',
        },
        { status: 400 }
      );
    }

    // 8. Check Minimum Order
    if (subtotalCents < settings.min_order_cents) {
      const minEuro = (settings.min_order_cents / 100).toFixed(2);
      const subEuro = (subtotalCents / 100).toFixed(2);
      return NextResponse.json(
        {
          error: `Le montant minimum de commande est de ${minEuro} €. Votre panier est actuellement de ${subEuro} €.`,
        },
        { status: 400 }
      );
    }

    // 9. Calculate Delivery Fee
    const isFreeDelivery = subtotalCents >= settings.free_delivery_above_cents;
    const deliveryFeeCents = isFreeDelivery ? 0 : settings.delivery_fee_cents;
    const totalCents = subtotalCents + deliveryFeeCents;

    // 10. Generate public code and order object
    const publicCode = generateOrderCode();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const orderRecord: Order = {
      id: orderId,
      public_code: publicCode,
      client_name: input.client_name,
      client_phone: input.client_phone,
      address: input.address,
      postal_code: input.postal_code,
      city: input.city,
      address_extra: input.address_extra || '',
      notes: input.notes || '',
      payment_method: input.payment_method,
      subtotal_cents: subtotalCents,
      delivery_fee_cents: deliveryFeeCents,
      total_cents: totalCents,
      status: 'new',
      assigned_driver: null,
      telegram_sent: false,
      created_at: createdAt,
      items: validatedItems,
    };

    // 11. Send Telegram Notification
    let telegramSent = false;
    try {
      ensureTelegramPollerStarted();
      const telegramResult = await sendTelegramOrderNotification(orderRecord, validatedItems);
      telegramSent = telegramResult.success;
      if (!telegramResult.success) {
        console.warn(`[Order ${publicCode}] Telegram dispatch notice:`, telegramResult.error);
      }
    } catch (tErr) {
      console.error(`[Order ${publicCode}] Telegram exception:`, tErr);
    }

    orderRecord.telegram_sent = telegramSent;

    // 12. Save to database (Supabase if available, fallback in-memory)
    if (isSupabaseConfigured) {
      const serviceClient = getServiceRoleClient();
      if (serviceClient) {
        try {
          const { error: ordErr } = await serviceClient.from('orders').insert({
            id: orderRecord.id,
            public_code: orderRecord.public_code,
            client_name: orderRecord.client_name,
            client_phone: orderRecord.client_phone,
            address: orderRecord.address,
            postal_code: orderRecord.postal_code,
            city: orderRecord.city,
            address_extra: orderRecord.address_extra,
            notes: orderRecord.notes,
            payment_method: orderRecord.payment_method,
            subtotal_cents: orderRecord.subtotal_cents,
            delivery_fee_cents: orderRecord.delivery_fee_cents,
            total_cents: orderRecord.total_cents,
            status: orderRecord.status,
            telegram_sent: orderRecord.telegram_sent,
            created_at: orderRecord.created_at,
          });

          if (!ordErr) {
            // Insert order items
            const itemRows = validatedItems.map((it) => ({
              order_id: orderRecord.id,
              product_id: it.product_id,
              product_name: it.product_name,
              price_cents: it.price_cents,
              quantity: it.quantity,
            }));
            await serviceClient.from('order_items').insert(itemRows);
          } else {
            console.error('[Supabase] Error inserting order:', ordErr);
            saveInMemoryOrder(orderRecord);
          }
        } catch (dbErr) {
          console.error('[Supabase] Exception inserting order:', dbErr);
          saveInMemoryOrder(orderRecord);
        }
      } else {
        saveInMemoryOrder(orderRecord);
      }
    } else {
      saveInMemoryOrder(orderRecord);
    }

    return NextResponse.json({
      success: true,
      public_code: publicCode,
      order: orderRecord,
    });
  } catch (err: any) {
    console.error('[POST /api/orders] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue lors de l’enregistrement de votre commande.' },
      { status: 500 }
    );
  }
}
