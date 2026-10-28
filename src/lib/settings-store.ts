import fs from 'fs';
import path from 'path';
import { StoreSettings } from '@/types/database';
import { siteConfig } from '@/config/site';

const SETTINGS_FILE = path.join(process.cwd(), '.settings.json');

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  min_order_cents: siteConfig.defaults.minOrderCents, // 1500 (15,00 €)
  delivery_fee_cents: siteConfig.defaults.deliveryFeeCents, // 300 (3,00 €)
  free_delivery_above_cents: siteConfig.defaults.freeDeliveryAboveCents, // 3000 (30,00 €)
  allowed_postal_codes: [...siteConfig.defaults.allowedPostalCodes], // 42300, 42120, 42370, 42153
  is_open: true,
  open_message: 'Ouvert 24h/24 & 7j/7 — Livraison rapide sur Roanne et alentours',
};

declare global {
  // eslint-disable-next-line no-var
  var __ELEVEN_SETTINGS__: StoreSettings | undefined;
}

function loadSettingsFromDisk(): StoreSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to read .settings.json:', err);
  }
  return { ...DEFAULT_STORE_SETTINGS };
}

function saveSettingsToDisk(settings: StoreSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write .settings.json:', err);
  }
}

if (!global.__ELEVEN_SETTINGS__) {
  global.__ELEVEN_SETTINGS__ = loadSettingsFromDisk();
}

export function getActiveSettings(): StoreSettings {
  if (!global.__ELEVEN_SETTINGS__) {
    global.__ELEVEN_SETTINGS__ = loadSettingsFromDisk();
  }
  return global.__ELEVEN_SETTINGS__;
}

export function updateActiveSettings(updates: Partial<StoreSettings>): StoreSettings {
  const current = getActiveSettings();
  const next: StoreSettings = {
    ...current,
    ...updates,
  };
  global.__ELEVEN_SETTINGS__ = next;
  saveSettingsToDisk(next);
  return next;
}
