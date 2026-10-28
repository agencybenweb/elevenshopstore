import { NextRequest, NextResponse } from 'next/server';
import { getInMemoryOrderByCode } from '@/lib/orders-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { Order, OrderItem } from '@/types/database';
import { checkTelegramUpdates, ensureTelegramPollerStarted } from '@/lib/telegram-poller';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
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
