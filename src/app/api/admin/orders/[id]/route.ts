import { NextRequest, NextResponse } from 'next/server';
import { inMemoryOrders } from '@/lib/orders-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { OrderStatus } from '@/types/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assigned_driver } = body as {
      status?: OrderStatus;
      assigned_driver?: string | null;
    };

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const updates: any = {};
        if (status) updates.status = status;
        if (assigned_driver !== undefined) updates.assigned_driver = assigned_driver;

        const { data, error } = await client
          .from('orders')
          .update(updates)
          .eq('id', id)
          .select('*')
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, order: data });
        }
      }
    }

    // In-memory update
    const memOrder = inMemoryOrders.find((o) => o.id === id || o.public_code === id);
    if (memOrder) {
      if (status) memOrder.status = status;
      if (assigned_driver !== undefined) memOrder.assigned_driver = assigned_driver;
      return NextResponse.json({ success: true, order: memOrder });
    }

    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  } catch (err: any) {
    console.error('[PATCH /api/admin/orders/[id]] Error:', err);
    return NextResponse.json({ error: 'Erreur mise à jour commande' }, { status: 500 });
  }
}
