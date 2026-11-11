import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Jeton d'annulation client : HMAC du code + id de commande avec un secret serveur.
 * Il n'est renvoyé qu'au navigateur qui a passé la commande (réponse du POST /api/orders),
 * ce qui empêche quelqu'un d'annuler la commande d'un autre en devinant son code ELV-XXXX.
 */
function getSecret(): string {
  return (
    process.env.ORDER_CANCEL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.TELEGRAM_BOT_TOKEN ||
    'eleven-shop-dev-secret'
  );
}

export function createCancelToken(orderId: string, publicCode: string): string {
  return createHmac('sha256', getSecret())
    .update(`cancel:${publicCode.toUpperCase()}:${orderId}`)
    .digest('base64url');
}

export function verifyCancelToken(orderId: string, publicCode: string, token: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(createCancelToken(orderId, publicCode));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
