/**
 * ══════════════════════════════════════════════
 *  ELEVEN SHOP — Calcul des frais de livraison (serveur uniquement)
 * ══════════════════════════════════════════════
 *
 * Règle :
 *  - Roanne / Le Coteau / Riorges  → frais de base (réglage admin, ex. 5 €)
 *  - Hors de ces 3 villes          → frais de base + X €/km pour chaque km
 *    de trajet routier au-delà de `includedKm` depuis la boutique
 *  - Panier ≥ seuil "livraison offerte" → 0 €, quelle que soit la distance
 *
 * Si la distance ne peut pas être calculée (services externes indisponibles),
 * on applique les frais de base pour ne jamais bloquer une commande, et la
 * commande est signalée au livreur.
 */
import { siteConfig } from '@/config/site';

type GeoPoint = { lat: number; lon: number; city?: string; postcode?: string };

export interface DeliveryQuote {
  feeCents: number;
  baseFeeCents: number;
  extraFeeCents: number;
  /** Distance routière boutique → client, en km (null si non calculée) */
  distanceKm: number | null;
  /** km facturés au-delà de la zone */
  extraKm: number;
  inZone: boolean;
  isFree: boolean;
  /** true si la distance n'a pas pu être calculée */
  estimated: boolean;
}

const { shopLocation, zoneCities, perKmCents, includedKm } = siteConfig.deliveryPricing;

const UA = 'ElevenShop-Delivery/1.0';
const TIMEOUT_MS = 4000;

function normalizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ZONE = new Set(zoneCities.map(normalizeCity));

export function isZoneCity(city: string | undefined | null): boolean {
  return Boolean(city) && ZONE.has(normalizeCity(city as string));
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── Géocodage : BAN (adresse.gouv) → Photon → Nominatim ── */
// Rayon max autour de la boutique : au-delà, le géocodeur s'est trompé de commune
const MAX_PLAUSIBLE_KM = 60;

async function geocode(address: string, postalCode: string, city: string): Promise<GeoPoint | null> {
  const q = encodeURIComponent(address ? `${address}, ${postalCode} ${city}` : `${postalCode} ${city}`);
  const dept = postalCode.slice(0, 2);
  // Rejette les homonymes (ex. un autre "Perreux" ailleurs en France)
  const plausible = (p: GeoPoint) =>
    (!p.postcode || p.postcode.slice(0, 2) === dept) && haversineKm(shopLocation, p) <= MAX_PLAUSIBLE_KM;

  const ban = await fetchJson(
    `https://data.geopf.fr/geocodage/search?q=${q}&postcode=${encodeURIComponent(postalCode)}&limit=1`
  );
  const banFeat = ban?.features?.[0];
  if (banFeat?.geometry?.coordinates && (banFeat.properties?.score ?? 0) >= 0.4) {
    const [lon, lat] = banFeat.geometry.coordinates;
    const p = { lat, lon, city: banFeat.properties?.city, postcode: banFeat.properties?.postcode };
    if (plausible(p)) return p;
  }

  const photon = await fetchJson(`https://photon.komoot.io/api/?q=${q}&limit=1&lang=fr&lat=${shopLocation.lat}&lon=${shopLocation.lon}`);
  const phFeat = photon?.features?.[0];
  if (phFeat?.geometry?.coordinates && phFeat.properties?.countrycode === 'FR') {
    const [lon, lat] = phFeat.geometry.coordinates;
    const p = { lat, lon, city: phFeat.properties?.city || phFeat.properties?.name, postcode: phFeat.properties?.postcode };
    if (plausible(p)) return p;
  }

  const nomi = await fetchJson(
    `https://nominatim.openstreetmap.org/search?q=${q}&countrycodes=fr&format=jsonv2&limit=1&addressdetails=1`
  );
  const n = nomi?.[0];
  if (n?.lat && n?.lon) {
    const a = n.address || {};
    const p = {
      lat: parseFloat(n.lat),
      lon: parseFloat(n.lon),
      city: a.city || a.town || a.village || a.municipality,
      postcode: a.postcode,
    };
    if (plausible(p)) return p;
  }

  return null;
}

/* ── Distance routière : OSRM → IGN → vol d'oiseau × 1,3 ── */
async function roadDistanceKm(to: GeoPoint): Promise<number | null> {
  const from = `${shopLocation.lon},${shopLocation.lat}`;
  const dest = `${to.lon},${to.lat}`;

  const osrm = await fetchJson(
    `https://router.project-osrm.org/route/v1/driving/${from};${dest}?overview=false`
  );
  const osrmM = osrm?.routes?.[0]?.distance;
  if (typeof osrmM === 'number') return osrmM / 1000;

  const ign = await fetchJson(
    `https://data.geopf.fr/navigation/itineraire?resource=bdtopo-osrm&start=${from}&end=${dest}&profile=car&optimization=shortest&distanceUnit=kilometer&getSteps=false`
  );
  if (typeof ign?.distance === 'number') return ign.distance;

  return null;
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Petit cache mémoire pour éviter de re-géocoder à chaque frappe / à la validation
const quoteCache = new Map<string, { at: number; distanceKm: number | null; city?: string }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

async function resolveDistance(address: string, postalCode: string, city: string) {
  const key = normalizeCity(`${address}|${postalCode}|${city}`);
  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached;

  let distanceKm: number | null = null;
  let resolvedCity: string | undefined;

  // Adresse exacte, sinon centre de la commune
  const point =
    (address ? await geocode(address, postalCode, city) : null) ?? (await geocode('', postalCode, city));
  if (point) {
    resolvedCity = point.city;
    distanceKm = await roadDistanceKm(point);
    if (distanceKm === null) {
      distanceKm = haversineKm(shopLocation, point) * 1.3;
    }
  }

  const entry = { at: Date.now(), distanceKm, city: resolvedCity };
  // On ne met en cache que les résultats aboutis
  if (distanceKm !== null) {
    if (quoteCache.size > 500) quoteCache.clear();
    quoteCache.set(key, entry);
  }
  return entry;
}

export async function computeDeliveryQuote(params: {
  address: string;
  postalCode: string;
  city: string;
  subtotalCents: number;
  baseFeeCents: number;
  freeDeliveryAboveCents: number;
}): Promise<DeliveryQuote> {
  const { address, postalCode, city, subtotalCents, baseFeeCents, freeDeliveryAboveCents } = params;

  const isFree = freeDeliveryAboveCents > 0 && subtotalCents >= freeDeliveryAboveCents;

  // La ville saisie suffit pour la zone de base : pas besoin d'appel externe
  if (isZoneCity(city)) {
    return {
      feeCents: isFree ? 0 : baseFeeCents,
      baseFeeCents,
      extraFeeCents: 0,
      distanceKm: null,
      extraKm: 0,
      inZone: true,
      isFree,
      estimated: false,
    };
  }

  const { distanceKm, city: geoCity } = await resolveDistance(address, postalCode, city);

  // Le géocodeur peut corriger la ville (ex. adresse saisie avec une mauvaise commune)
  const inZone = isZoneCity(geoCity);
  const extraKm =
    !inZone && distanceKm !== null ? Math.max(0, Math.round((distanceKm - includedKm) * 10) / 10) : 0;
  const extraFeeCents = Math.round(extraKm * perKmCents);

  return {
    feeCents: isFree ? 0 : baseFeeCents + extraFeeCents,
    baseFeeCents,
    extraFeeCents,
    distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
    extraKm,
    inZone,
    isFree,
    estimated: distanceKm === null,
  };
}
