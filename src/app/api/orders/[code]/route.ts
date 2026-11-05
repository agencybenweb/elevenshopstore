import { NextRequest, NextResponse } from 'next/server';
import { getInMemoryOrderByCode } from '@/lib/orders-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { Order, OrderItem } from '@/types/database';
import { checkTelegramUpdates, ensureTelegramPollerStarted } from '@/lib/telegram-poller';

// Anti brute-force rate limit per IP for order status lookups
const ipLookupLimits = new Map<string, number[]>();
const MAX_LOOKUPS_PER_MINUTE = 60;
const WINDOW_MS = 60 * 1000;

function checkLookupRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipLookupLimits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_LOOKUPS_PER_MINUTE) return false;
  timestamps.push(now);
  ipLookupLimits.set(ip, timestamps);
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkLookupRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.' },
        { status: 429 }
      );
    }

    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }

    // Ensure background poller is running and check for fresh Telegram button clicks
    ensureTelegramPollerStarted();
    await checkTelegramUpdates();

    const normCode = code.toUpperCase().trim();

    // Check Supabase if configured
    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const { data: dbOrder } = await client
          .from('orders')
          .select('*')
          .eq('public_code', normCode)
          .single();

        if (dbOrder) {
          const { data: dbItems } = await client
            .from('order_items')
            .select('*')
            .eq('order_id', dbOrder.id);

          const fullOrder: Order = {
            ...(dbOrder as Order),
            items: (dbItems as OrderItem[]) || [],
          };

          // Fallback check: if notes contains [ARRIVED] and order is active, map status to arriving
          if (
            fullOrder.notes?.includes('[ARRIVED]') &&
            fullOrder.status !== 'delivered' &&
            fullOrder.status !== 'cancelled'
          ) {
            fullOrder.status = 'arriving';
          }

          return NextResponse.json({ order: fullOrder });
        }
      }
    }

    // Check in-memory store
    const memOrder = getInMemoryOrderByCode(normCode);
    if (memOrder) {
      return NextResponse.json({ order: memOrder });
    }

    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  } catch (err: any) {
    console.error('[GET /api/orders/[code]] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
