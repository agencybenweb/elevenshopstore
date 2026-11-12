import { NextRequest, NextResponse } from 'next/server';

/**
 * GPS position → postal address, for the checkout "utiliser ma position" button.
 * BAN (official, knows house numbers) on its two hosts → Nominatim → Photon.
 */
const UA = 'ElevenShop-Delivery/1.0';

const ipLimits = new Map<string, number[]>();
function allow(ip: string): boolean {
  const now = Date.now();
  const t = (ipLimits.get(ip) || []).filter((x) => now - x < 60_000);
  if (t.length >= 10) return false;
  t.push(now);
  ipLimits.set(ip, t);
  return true;
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type Found = { address: string; postalCode: string; city: string; precise: boolean };

async function fromBan(lat: number, lon: number): Promise<Found | null> {
  const q = `reverse?lon=${lon}&lat=${lat}&limit=1`;
  const d =
    (await fetchJson(`https://data.geopf.fr/geocodage/${q}`)) ??
    (await fetchJson(`https://api-adresse.data.gouv.fr/${q}`));
  const p = d?.features?.[0]?.properties;
  if (!p?.postcode || !p?.city) return null;
  return { address: p.name || '', postalCode: p.postcode, city: p.city, precise: p.type === 'housenumber' };
}

async function fromNominatim(lat: number, lon: number): Promise<Found | null> {
  const d = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=18&accept-language=fr`
  );
  const a = d?.address;
  const city = a?.city || a?.town || a?.village || a?.municipality;
  if (!a?.postcode || !city) return null;
  const street = a.road || a.pedestrian || a.hamlet || '';
  return {
    address: [a.house_number, street].filter(Boolean).join(' '),
    postalCode: String(a.postcode).slice(0, 5),
    city,
    precise: Boolean(a.house_number),
  };
}

async function fromPhoton(lat: number, lon: number): Promise<Found | null> {
  const d = await fetchJson(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=fr&limit=1`);
  const p = d?.features?.[0]?.properties;
  if (!p?.postcode || !p?.city) return null;
  return {
    address: [p.housenumber, p.street || p.name].filter(Boolean).join(' '),
    postalCode: String(p.postcode).slice(0, 5),
    city: p.city,
    precise: Boolean(p.housenumber),
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
  if (!allow(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Position invalide' }, { status: 400 });
  }

  // keep the best answer: a house-number match wins, otherwise the first street-level one
  let best: Found | null = null;
  for (const source of [fromBan, fromNominatim, fromPhoton]) {
    const found = await source(lat, lon);
    if (found?.precise) return NextResponse.json(found);
    if (found && !best) best = found;
  }
  if (best) return NextResponse.json(best);
  return NextResponse.json({ error: 'Adresse introuvable' }, { status: 404 });
}
