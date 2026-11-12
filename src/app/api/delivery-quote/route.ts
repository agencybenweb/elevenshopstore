import { NextRequest, NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/products';
import { computeDeliveryQuote } from '@/lib/delivery-fee';

// Limite anti-abus : le calcul appelle des services de géocodage externes
const ipQuoteLimits = new Map<string, number[]>();
const MAX_QUOTES_PER_MINUTE = 20;
const WINDOW_MS = 60 * 1000;

function checkQuoteRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipQuoteLimits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_QUOTES_PER_MINUTE) return false;
  timestamps.push(now);
  ipQuoteLimits.set(ip, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    if (!checkQuoteRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
    }

    const body = await req.json();
    const address = String(body?.address || '').slice(0, 200).trim();
    const postalCode = String(body?.postal_code || '').slice(0, 10).trim();
    const city = String(body?.city || '').slice(0, 100).trim();
    const subtotalCents = Math.max(0, Math.round(Number(body?.subtotal_cents) || 0));
    const lat = Number(body?.lat);
    const lon = Number(body?.lon);
    const coords =
      Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;

    if (!city || !/^\d{5}$/.test(postalCode)) {
      return NextResponse.json({ error: 'Adresse incomplète' }, { status: 400 });
    }

    const settings = await getStoreSettings();
    const quote = await computeDeliveryQuote({
      address,
      postalCode,
      city,
      subtotalCents,
      baseFeeCents: settings.delivery_fee_cents,
      freeDeliveryAboveCents: settings.free_delivery_above_cents,
      allowedPostalCodes: settings.allowed_postal_codes,
      coords,
    });

    return NextResponse.json({ quote });
  } catch (err) {
    console.error('[POST /api/delivery-quote] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
