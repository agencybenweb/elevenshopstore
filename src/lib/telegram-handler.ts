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
          // 1. Fetch existing order to verify it exists and get assigned driver
          const { data: dbExisting, error: fetchErr } = await client
            .from('orders')
            .select('*')
            .eq('public_code', code)
            .single();

          if (dbExisting) {
            const activeDriver = dbExisting.assigned_driver || driverName;

            // 2. Try direct update to status 'arriving'
            const { data: dbOrder, error: updateErr } = await client
              .from('orders')
              .update({ status: 'arriving', assigned_driver: activeDriver })
              .eq('public_code', code)
              .select('*')
              .single();

            if (!updateErr && dbOrder) {
              order = dbOrder as Order;
            } else {
              // 3. Fallback: if 'arriving' violates check constraint, mark via [ARRIVED] in notes
              console.warn(
                '[Telegram Handler] Supabase status arriving rejected by DB check constraint. Using [ARRIVED] notes tag fallback:',
                updateErr
              );
              const currentNotes = dbExisting.notes || '';
              const newNotes = currentNotes.includes('[ARRIVED]')
                ? currentNotes
                : currentNotes
                ? `${currentNotes} [ARRIVED]`
                : '[ARRIVED]';

              const { data: fallbackOrder, error: fallbackErr } = await client
                .from('orders')
                .update({ notes: newNotes, assigned_driver: activeDriver })
                .eq('public_code', code)
                .select('*')
                .single();

              if (fallbackOrder) {
                order = { ...(fallbackOrder as Order), status: 'arriving' };
              } else {
                console.error('[Telegram Handler] Fallback notes update failed:', fallbackErr);
                order = { ...(dbExisting as Order), status: 'arriving', assigned_driver: activeDriver };
              }
            }

            // 4. Fetch order items for Telegram recap
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', dbExisting.id);
            items = (dbItems as OrderItem[]) || [];
          } else {
            console.warn(`[Telegram Handler] Order #${code} not found in Supabase:`, fetchErr);
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase arrive exception:', dbErr);
        }
      }
    }

    if (!order) {
      order = updateInMemoryOrderStatus(code, 'arriving', driverName);
      items = order?.items || [];
    }

    if (order) {
      const driverToDisplay = order.assigned_driver || driverName;
      if (messageId) {
        await updateTelegramOrderMessage(messageId, order, items, driverToDisplay);
      }
      await answerCallbackQuery(callbackId, `🏁 Commande #${code} — ${driverToDisplay} est arrivé !`);
      console.log(`[Telegram Handler] Order #${code} — ${driverToDisplay} arrived (status: arriving)`);
      return true;
    } else {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }
  }

  // ── Livreur annonce la livraison effectuée ──
  if (data.startsWith('deliver:')) {
    const code = data.replace('deliver:', '').trim().toUpperCase();

    let order: Order | null = null;
    let items: OrderItem[] = [];

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const { data: dbExisting } = await client
            .from('orders')
            .select('*')
            .eq('public_code', code)
            .single();

          const cleanNotes = (dbExisting?.notes || '').replace('[ARRIVED]', '').trim();
          const activeDriver = dbExisting?.assigned_driver || driverName;

          const { data: dbOrder, error: dbErr } = await client
            .from('orders')
            .update({ status: 'delivered', notes: cleanNotes, assigned_driver: activeDriver })
            .eq('public_code', code)
            .select('*')
            .single();

          if (!dbErr && dbOrder) {
            order = dbOrder as Order;
          } else if (dbExisting) {
            order = { ...(dbExisting as Order), status: 'delivered', notes: cleanNotes, assigned_driver: activeDriver };
          }

          if (dbExisting) {
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', dbExisting.id);
            items = (dbItems as OrderItem[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase deliver error:', dbErr);
        }
      }
    }

    if (!order) {
      order = updateInMemoryOrderStatus(code, 'delivered', driverName);
      items = order?.items || [];
    }

    if (order) {
      const driverToDisplay = order.assigned_driver || driverName;
      if (messageId) {
        await updateTelegramOrderMessage(messageId, order, items, driverToDisplay);
      }
      await answerCallbackQuery(callbackId, `✅ Commande #${code} marquée comme livrée !`);
      console.log(`[Telegram Handler] Order #${code} delivered by ${driverToDisplay}`);
      return true;
    } else {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }
  }

  // ── Livreur annule sa prise en charge : la commande repasse en "new" ──
  if (data.startsWith('unclaim:')) {
    const code = data.replace('unclaim:', '').trim().toUpperCase();
    const releasableStatuses: Order['status'][] = ['taken', 'delivering', 'arriving'];

    let existing: Order | null = null;
    let items: OrderItem[] = [];
    let order: Order | null = null;

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const { data: dbExisting } = await client
            .from('orders')
            .select('*')
            .eq('public_code', code)
            .single();

          if (dbExisting) {
            existing = dbExisting as Order;
            const { data: dbItems } = await client
              .from('order_items')
              .select('*')
              .eq('order_id', dbExisting.id);
            items = (dbItems as OrderItem[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Handler] Supabase unclaim fetch error:', dbErr);
        }
      }
    }

    if (!existing) {
      existing = getInMemoryOrderByCode(code);
      items = existing?.items || [];
    }

    if (!existing) {
      await answerCallbackQuery(callbackId, `Commande #${code} introuvable.`);
      return false;
    }

    const isArrivedViaNotes = (existing.notes || '').includes('[ARRIVED]');
    if (!releasableStatuses.includes(existing.status) && !isArrivedViaNotes) {
      await answerCallbackQuery(
        callbackId,
        existing.status === 'new'
          ? `Commande #${code} déjà disponible.`
          : `Commande #${code} ne peut plus être annulée (${existing.status}).`
      );
      return false;
    }

    // Seul le livreur qui a pris la commande peut la relâcher
    if (existing.assigned_driver && existing.assigned_driver !== driverName) {
      await answerCallbackQuery(
        callbackId,
        `Seul ${existing.assigned_driver} peut annuler cette prise en charge.`
      );
      return false;
    }

    const cleanNotes = (existing.notes || '').replace('[ARRIVED]', '').trim();

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const { data: dbOrder, error: dbErr } = await client
          .from('orders')
          .update({ status: 'new', assigned_driver: null, notes: cleanNotes })
          .eq('public_code', code)
          .in('status', releasableStatuses)
          .select('*')
          .single();
        if (dbErr) {
          console.error('[Telegram Handler] Supabase unclaim update error:', dbErr);
        } else if (dbOrder) {
          order = dbOrder as Order;
        }
      }
    }

    if (!order) {
      const mem = getInMemoryOrderByCode(code);
      if (mem) {
        mem.status = 'new';
        mem.assigned_driver = null;
        mem.notes = cleanNotes;
        order = mem;
      }
    }

    if (!order) {
      await answerCallbackQuery(callbackId, `Impossible d'annuler la prise en charge de #${code}.`);
      return false;
    }

    if (messageId) {
      await updateTelegramOrderMessage(messageId, order, items, driverName);
    }
    await answerCallbackQuery(callbackId, `↩️ Prise en charge de #${code} annulée — commande remise en attente.`);
    console.log(`[Telegram Handler] Order #${code} released by ${driverName} (status: new)`);
    return true;
  }

  if (data.startsWith('noop:')) {
    await answerCallbackQuery(callbackId, 'Cette commande a déjà été livrée.');
    return true;
  }

  return false;
}
