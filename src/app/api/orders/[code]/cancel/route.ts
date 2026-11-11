import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { getInMemoryOrderByCode } from '@/lib/orders-store';
import { verifyCancelToken } from '@/lib/order-token';
import { sendTelegramCancellationNotice } from '@/lib/telegram';
import { Order, OrderItem } from '@/types/database';

/** Statuts pour lesquels le client peut encore annuler (avant l'arrivée du livreur) */
const CLIENT_CANCELLABLE: Order['status'][] = ['new', 'taken', 'delivering'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const normCode = (code || '').toUpperCase().trim();
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '');

    let order: Order | null = null;
    let items: OrderItem[] = [];
    const client = isSupabaseConfigured ? getServiceRoleClient() : null;

    if (client) {
      const { data: dbOrder } = await client
        .from('orders')
        .select('*')
        .eq('public_code', normCode)
        .single();
      if (dbOrder) {
        order = dbOrder as Order;
        const { data: dbItems } = await client
          .from('order_items')
          .select('*')
          .eq('order_id', dbOrder.id);
        items = (dbItems as OrderItem[]) || [];
      }
    }
    const memOrder = order ? null : getInMemoryOrderByCode(normCode);
    if (memOrder) {
      order = memOrder;
      items = memOrder.items || [];
    }

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    if (!verifyCancelToken(order.id, order.public_code, token)) {
      return NextResponse.json(
        { error: "Annulation impossible depuis cet appareil. Appelez l'épicerie pour annuler." },
        { status: 403 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ success: true, order });
    }

    const hasArrived = (order.notes || '').includes('[ARRIVED]');
    if (!CLIENT_CANCELLABLE.includes(order.status) || hasArrived) {
      return NextResponse.json(
        {
          error:
            order.status === 'delivered'
              ? 'Cette commande a déjà été livrée.'
              : "Le livreur est déjà à votre porte : appelez l'épicerie pour annuler.",
        },
        { status: 409 }
      );
    }

    const previousDriver = order.assigned_driver || null;
    const cleanNotes = (order.notes || '').replace('[ARRIVED]', '').trim();
    let updated: Order | null = null;

    if (client && !memOrder) {
      const { data: dbOrder, error } = await client
        .from('orders')
        .update({ status: 'cancelled', notes: cleanNotes })
        .eq('public_code', normCode)
        .in('status', CLIENT_CANCELLABLE)
        .select('*')
        .single();
      if (error || !dbOrder) {
        console.error('[Cancel] Supabase update error:', error);
        return NextResponse.json(
          { error: "La commande vient de changer de statut. Appelez l'épicerie pour annuler." },
          { status: 409 }
        );
      }
      updated = dbOrder as Order;
    } else if (memOrder) {
      memOrder.status = 'cancelled';
      memOrder.notes = cleanNotes;
      updated = memOrder;
    }

    if (!updated) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    await sendTelegramCancellationNotice(updated, items, previousDriver);
    console.log(`[Cancel] Order #${normCode} cancelled by client (driver: ${previousDriver || 'none'})`);

    return NextResponse.json({ success: true, order: { ...updated, items } });
  } catch (err) {
    console.error('[POST /api/orders/[code]/cancel] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
