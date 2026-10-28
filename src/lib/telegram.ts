import { Order, OrderItem } from '@/types/database';

// Server-safe price formatter (cannot use client-only hooks here)
function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export function isTelegramConfigured(): boolean {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

export function formatOrderTelegramMessage(
  order: Order,
  items: OrderItem[],
  driverName?: string | null
): string {
  const itemsText = items
    .map(
      (i) =>
        `• <b>${i.quantity}×</b> ${escapeHtml(i.product_name)} (<i>${formatPrice(
          i.price_cents * i.quantity
        )}</i>)`
    )
    .join('\n');

  const paymentText =
    order.payment_method === 'cash'
      ? '💵 Espèces à la livraison'
      : '💳 Carte bancaire à la livraison';

  const cleanPhone = order.client_phone.replace(/\s+/g, '');
  const telLink = `<a href="tel:${cleanPhone}">${escapeHtml(order.client_phone)}</a>`;

  const encodedAddress = encodeURIComponent(
    `${order.address}, ${order.postal_code} ${order.city}`
  );
  const mapsLink = `<a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}">📍 ${escapeHtml(
    order.address
  )}, ${order.postal_code} ${escapeHtml(order.city)}</a>`;

  let statusHeader = `🚨 <b>NOUVELLE COMMANDE #${order.public_code}</b>`;
  if (order.status === 'taken' && driverName) {
    statusHeader = `🛵 <b>COMMANDE #${order.public_code} PRIS EN CHARGE PAR ${escapeHtml(
      driverName.toUpperCase()
    )}</b>`;
  } else if (order.status === 'delivered') {
    statusHeader = `✅ <b>COMMANDE #${order.public_code} LIVRÉE</b>`;
  }

  let text = `${statusHeader}

🛒 <b>ARTICLES :</b>
${itemsText}

💰 <b>Sous-total :</b> ${formatPrice(order.subtotal_cents)}
🛵 <b>Frais de livraison :</b> ${
    order.delivery_fee_cents === 0
      ? '<b>OFFERT</b>'
      : formatPrice(order.delivery_fee_cents)
  }
💎 <b>TOTAL À RÉGLER : ${formatPrice(order.total_cents)}</b>
💳 <b>Mode de paiement :</b> ${paymentText}

👤 <b>Client :</b> ${escapeHtml(order.client_name)}
📞 <b>Téléphone :</b> ${telLink}
🏠 <b>Adresse :</b> ${mapsLink}`;

  if (order.address_extra) {
    text += `\n🏢 <b>Complément :</b> ${escapeHtml(order.address_extra)}`;
  }
  if (order.notes) {
    text += `\n📝 <b>Remarques :</b> <i>${escapeHtml(order.notes)}</i>`;
  }

  return text;
}

export function getInlineKeyboard(publicCode: string, status: string, driverName?: string | null) {
  if (status === 'new') {
    return {
      inline_keyboard: [
        [
          {
            text: '🛵 Je prends la commande',
            callback_data: `claim:${publicCode}`,
          },
        ],
      ],
    };
  }

  if (status === 'taken') {
    return {
      inline_keyboard: [
        [
          {
            text: `✅ Marquer comme livrée (${driverName || 'Livreur'})`,
            callback_data: `deliver:${publicCode}`,
          },
        ],
      ],
    };
  }

  // delivered or cancelled -> no active buttons
  return {
    inline_keyboard: [
      [
        {
          text: `✅ Livrée par ${driverName || 'Livreur'}`,
          callback_data: `noop:${publicCode}`,
        },
      ],
    ],
  };
}

export async function sendTelegramOrderNotification(
  order: Order,
  items: OrderItem[]
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!isTelegramConfigured()) {
    console.warn(
      `[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Order #${order.public_code} saved without Telegram alert.`
    );
    return { success: false, error: 'Telegram environment variables missing' };
  }

  try {
    const text = formatOrderTelegramMessage(order, items);
    const replyMarkup = getInlineKeyboard(order.public_code, 'new');

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] API error:', data);
      return { success: false, error: data.description };
    }

    return { success: true, messageId: data.result.message_id };
  } catch (err: any) {
    console.error('[Telegram] Network error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateTelegramOrderMessage(
  messageId: number,
  order: Order,
  items: OrderItem[],
  driverName?: string | null
): Promise<boolean> {
  if (!isTelegramConfigured()) return false;

  try {
    const text = formatOrderTelegramMessage(order, items, driverName);
    const replyMarkup = getInlineKeyboard(order.public_code, order.status, driverName);

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.error('[Telegram] Error editing message:', err);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
