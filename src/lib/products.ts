import { Category, Product, StoreSettings } from '@/types/database';
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_SETTINGS } from '@/lib/demo-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getActiveProductsAsync } from '@/lib/products-store';

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Fallback
    }
  }
  return DEMO_CATEGORIES;
}

export async function getProducts(options?: {
  categoryId?: string;
  onlyAvailable?: boolean;
}): Promise<Product[]> {
  let list = await getActiveProductsAsync();
  if (options?.categoryId && options.categoryId !== 'all') {
    list = list.filter((p) => p.category_id === options.categoryId);
  }
  if (options?.onlyAvailable) {
    list = list.filter((p) => p.is_available);
  }
  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.id === id) || null;
}

import { getActiveSettings } from '@/lib/settings-store';

export async function getStoreSettings(): Promise<StoreSettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
      if (!error && data) {
        return {
          min_order_cents: data.min_order_cents ?? getActiveSettings().min_order_cents,
          delivery_fee_cents: data.delivery_fee_cents ?? getActiveSettings().delivery_fee_cents,
          free_delivery_above_cents: data.free_delivery_above_cents ?? getActiveSettings().free_delivery_above_cents,
          allowed_postal_codes: data.allowed_postal_codes ?? getActiveSettings().allowed_postal_codes,
          is_open: data.is_open ?? getActiveSettings().is_open,
          open_message: data.open_message ?? getActiveSettings().open_message,
        };
      }
    } catch {
      // Fallback
    }
  }
  return getActiveSettings();
}
