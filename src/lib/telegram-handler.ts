import { Order, OrderItem } from '@/types/database';
import { updateTelegramOrderMessage } from '@/lib/telegram';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { getInMemoryOrderByCode, updateInMemoryOrderStatus } from '@/lib/orders-store';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function answerCallbackQuery(callbackQueryId: string, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch (err) {
    console.error('[Telegram] Error answering callback query:', err);
  }
}

export async function handleTelegramCallbackQuery(callbackQuery: any): Promise<boolean> {
  if (!callbackQuery || !callbackQuery.data) return false;

  const { id: callbackId, data, from, message } = callbackQuery;
  const driverName = from?.first_name || from?.username || 'Livreur';
  const messageId = message?.message_id;

  if (data.startsWith('claim:')) {
    const code = data.replace('claim:', '').trim().toUpperCase();

    let order: Order | null = null;
    let items: OrderItem[] = [];

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const { data: dbOrder, error: dbErr } = await client
            .from('orders')
            .update({ status: 'delivering', assigned_driver: driverName })
            .eq('public_code', code)
            .select('*')
            .single();

          if (dbErr) {
            console.warn('[Telegram Handler] Supabase claim update error (delivering):', dbErr);
            // Fallback to 'taken' if DB constraint requires taken
            const { data: fallbackOrder } = await client
              .from('orders')
              .update({ status: 'taken', assigned_driver: driverName })
              .eq('public_code', code)
              .select('*')
              .single();
            if (fallbackOrder) {
              order = fallbackOrder as Order;
            }
          } else if (dbOrder) {
            order = dbOrder as Order;
          }

          if (order) {
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            items = (dbItems as OrderItem[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase update error:', dbErr);
        }
      }
    }

    if (!order) {
      order = updateInMemoryOrderStatus(code, 'delivering', driverName);
      items = order?.items || [];
    }

    if (order) {
      if (messageId) {
        await updateTelegramOrderMessage(messageId, order, items, driverName);
      }
      await answerCallbackQuery(callbackId, `🛵 Commande #${code} prise en charge par ${driverName} — En route !`);
      console.log(`[Telegram Handler] Order #${code} taken by ${driverName} (status: delivering)`);
      return true;
    } else {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }
  }

  // ── Livreur annonce son arrivée ──
  if (data.startsWith('arrive:')) {
    const code = data.replace('arrive:', '').trim().toUpperCase();

    let order: Order | null = null;
    let items: OrderItem[] = [];

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const { data: dbOrder } = await client
            .from('orders')
            .update({ status: 'arriving' })
            .eq('public_code', code)
            .select('*')
            .single();

          if (dbOrder) {
            order = dbOrder as Order;
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', dbOrder.id);
            items = (dbItems as OrderItem[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase update error:', dbErr);
        }
      }
    }

    if (!order) {
      order = updateInMemoryOrderStatus(code, 'arriving', driverName);
      items = order?.items || [];
    }

    if (order) {
      if (messageId) {
        await updateTelegramOrderMessage(messageId, order, items, order.assigned_driver || driverName);
      }
      await answerCallbackQuery(callbackId, `🏁 Commande #${code} — ${driverName} est arrivé !`);
      console.log(`[Telegram Handler] Order #${code} — ${driverName} arrived`);
      return true;
    } else {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }
  }

  if (data.startsWith('deliver:')) {
    const code = data.replace('deliver:', '').trim().toUpperCase();

    let order: Order | null = null;
    let items: OrderItem[] = [];

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const { data: dbOrder } = await client
            .from('orders')
            .update({ status: 'delivered' })
            .eq('public_code', code)
            .select('*')
            .single();

          if (dbOrder) {
            order = dbOrder as Order;
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', dbOrder.id);
            items = (dbItems as OrderItem[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase update error:', dbErr);
        }
      }
    }

    if (!order) {
      order = updateInMemoryOrderStatus(code, 'delivered', driverName);
      items = order?.items || [];
    }

    if (order) {
      if (messageId) {
        await updateTelegramOrderMessage(messageId, order, items, order.assigned_driver || driverName);
      }
      await answerCallbackQuery(callbackId, `✅ Commande #${code} marquée comme livrée !`);
      console.log(`[Telegram Handler] Order #${code} delivered by ${order.assigned_driver || driverName}`);
      return true;
    } else {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }
  }

  if (data.startsWith('noop:')) {
    await answerCallbackQuery(callbackId, 'Cette commande a déjà été livrée.');
    return true;
  }

  return false;
}
