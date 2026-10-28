'use client';

import { useState, useEffect, useCallback } from 'react';
import { StoreSettings } from '@/types/database';
import { siteConfig } from '@/config/site';

const SETTINGS_KEY = 'eleven-shop-settings';

export const DEFAULT_CLIENT_SETTINGS: StoreSettings = {
  min_order_cents: siteConfig.defaults.minOrderCents,
  delivery_fee_cents: siteConfig.defaults.deliveryFeeCents,
  free_delivery_above_cents: siteConfig.defaults.freeDeliveryAboveCents,
  allowed_postal_codes: [...siteConfig.defaults.allowedPostalCodes],
  is_open: true,
  open_message: 'Ouvert 24h/24 & 7j/7 — Livraison rapide sur Roanne et alentours',
};

let globalSettingsState: StoreSettings = DEFAULT_CLIENT_SETTINGS;
const settingsListeners = new Set<() => void>();
let isInitialized = false;

function notifySettingsListeners() {
  settingsListeners.forEach((fn) => fn());
}

export function updateGlobalSettings(newSettings: StoreSettings) {
  globalSettingsState = { ...globalSettingsState, ...newSettings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(globalSettingsState));
      window.dispatchEvent(new CustomEvent('eleven-settings-updated', { detail: globalSettingsState }));
    } catch {
      // Ignore
    }
  }
  notifySettingsListeners();
}

async function fetchRemoteSettings(): Promise<StoreSettings | null> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.settings) {
      updateGlobalSettings(data.settings);
      return data.settings;
    }
  } catch (err) {
    console.error('Failed to fetch store settings:', err);
  }
  return null;
}

export function useSettings(initialSettings?: StoreSettings) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (initialSettings) {
      globalSettingsState = { ...globalSettingsState, ...initialSettings };
      return globalSettingsState;
    }
    return globalSettingsState;
  });
  const [isLoading, setIsLoading] = useState(!isInitialized && !initialSettings);

  useEffect(() => {
    if (initialSettings) {
      globalSettingsState = { ...globalSettingsState, ...initialSettings };
      setSettings(globalSettingsState);
    }
    // 1. Initial localStorage read
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SETTINGS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          globalSettingsState = { ...DEFAULT_CLIENT_SETTINGS, ...parsed };
          setSettings(globalSettingsState);
        }
      } catch {
        // Ignore
      }
    }

    // 2. Fetch fresh settings from server
    if (!isInitialized) {
      isInitialized = true;
      fetchRemoteSettings().finally(() => setIsLoading(false));
    }

    // 3. Subscribe to local updates
    const handleChange = () => {
      setSettings(globalSettingsState);
    };
    settingsListeners.add(handleChange);

    // 4. Cross-tab & window event listener
    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<StoreSettings>;
      if (custom.detail) {
        setSettings(custom.detail);
      }
    };
    window.addEventListener('eleven-settings-updated', handleCustomEvent);

    return () => {
      settingsListeners.delete(handleChange);
      window.removeEventListener('eleven-settings-updated', handleCustomEvent);
    };
  }, []);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    await fetchRemoteSettings();
    setIsLoading(false);
  }, []);

  return {
    settings,
    isLoading,
    refreshSettings,
  };
}
