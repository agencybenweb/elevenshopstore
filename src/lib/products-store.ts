import fs from 'fs';
import path from 'path';
import { Product } from '@/types/database';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

const PRODUCTS_FILE = path.join(process.cwd(), '.products.json');

declare global {
  // eslint-disable-next-line no-var
  var __ELEVEN_PRODUCTS__: Product[] | undefined;
}

function loadProductsFromDisk(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read .products.json:', err);
  }

  // Fallback to DEMO_PRODUCTS and persist
  const defaults = JSON.parse(JSON.stringify(DEMO_PRODUCTS));
  saveProductsToDisk(defaults);
  return defaults;
}

function saveProductsToDisk(products: Product[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write .products.json:', err);
  }
}

export function getActiveProducts(): Product[] {
  if (!global.__ELEVEN_PRODUCTS__) {
    global.__ELEVEN_PRODUCTS__ = loadProductsFromDisk();
  }
  return global.__ELEVEN_PRODUCTS__;
}

export async function saveProduct(productInput: Partial<Product> & { id?: string }): Promise<Product> {
  const current = getActiveProducts();
  const id = productInput.id || `prod-${Date.now()}`;
  const idx = current.findIndex((p) => p.id === id);

  let updatedProduct: Product;

  if (idx >= 0) {
    // Update existing product
    updatedProduct = {
      ...current[idx],
      ...productInput,
      id,
      price_cents: Number(productInput.price_cents ?? current[idx].price_cents),
    };
    current[idx] = updatedProduct;
  } else {
    // Create new product
    const slug =
      productInput.slug ||
      (productInput.nom || 'produit')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    updatedProduct = {
      id,
      nom: productInput.nom || 'Nouveau Produit',
      slug,
      description: productInput.description || '',
      price_cents: Number(productInput.price_cents || 200),
      image_url: productInput.image_url || '/products/can-energy.svg',
      category_id: productInput.category_id || 'cat-sodas',
      is_available: productInput.is_available ?? true,
      stock: productInput.stock ?? 20,
      sort_order: productInput.sort_order ?? (current.length + 1),
      is_featured: productInput.is_featured ?? false,
      is_age_restricted: productInput.is_age_restricted ?? false,
      hero_bg_color: productInput.hero_bg_color,
      hero_big_word: productInput.hero_big_word,
    };
    current.unshift(updatedProduct); // Add to top for immediate visibility
  }

  global.__ELEVEN_PRODUCTS__ = [...current];
  saveProductsToDisk(global.__ELEVEN_PRODUCTS__);

  // Sync with Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleClient();
      if (client) {
        await client.from('products').upsert(updatedProduct);
      }
    } catch (err) {
      console.error('Supabase product upsert error:', err);
    }
  }

  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const current = getActiveProducts();
  const filtered = current.filter((p) => p.id !== id);

  if (filtered.length === current.length) {
    return false; // Not found
  }

  global.__ELEVEN_PRODUCTS__ = filtered;
  saveProductsToDisk(filtered);

  // Sync with Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleClient();
      if (client) {
        await client.from('products').delete().eq('id', id);
      }
    } catch (err) {
      console.error('Supabase product delete error:', err);
    }
  }

  return true;
}
