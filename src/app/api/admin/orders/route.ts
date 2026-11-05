import { NextRequest, NextResponse } from 'next/server';
import { inMemoryOrders } from '@/lib/orders-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { Order, OrderItem } from '@/types/database';
import { checkTelegramUpdates, ensureTelegramPollerStarted } from '@/lib/telegram-poller';
import { validateAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    // Vérification de sécurité Admin
    if (!validateAdminRequest(req)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    ensureTelegramPollerStarted();
    await checkTelegramUpdates();
    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const { data: dbOrders, error } = await client
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbOrders) {
          const { data: allItems } = await client.from('order_items').select('*');
          const itemsMap = new Map<string, OrderItem[]>();
          (allItems || []).forEach((item: any) => {
            const list = itemsMap.get(item.order_id) || [];
            list.push(item);
            itemsMap.set(item.order_id, list);
          });

          const ordersWithItems: Order[] = dbOrders.map((o: any) => {
            const mappedOrder: Order = {
              ...o,
              items: itemsMap.get(o.id) || [],
            };
            if (
              mappedOrder.notes?.includes('[ARRIVED]') &&
              mappedOrder.status !== 'delivered' &&
              mappedOrder.status !== 'cancelled'
            ) {
              mappedOrder.status = 'arriving';
            }
            return mappedOrder;
          });

          return NextResponse.json({ orders: ordersWithItems });
        }
      }
    }

    // Fallback in-memory orders
    return NextResponse.json({ orders: inMemoryOrders });
  } catch (err: any) {
    console.error('[GET /api/admin/orders] Error:', err);
    return NextResponse.json({ error: 'Erreur récupération commandes' }, { status: 500 });
  }
}
