import fs from 'fs';
import path from 'path';
import { Product } from '@/types/database';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

// On Vercel / serverless, process.cwd() is read-only (/var/task). /tmp is writable.
const PRODUCTS_FILE = process.env.VERCEL
  ? path.join('/tmp', '.products.json')
  : path.join(process.cwd(), '.products.json');

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
    console.warn('[products-store] Notice reading .products.json:', err);
  }

  // Fallback to DEMO_PRODUCTS
  const defaults = JSON.parse(JSON.stringify(DEMO_PRODUCTS));
  saveProductsToDisk(defaults);
  return defaults;
}

function saveProductsToDisk(products: Product[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal on serverless if disk is constrained
    console.warn('[products-store] Notice writing .products.json:', err);
  }
}

/**
 * Synchronous getter (returns cached memory or local disk)
 */
export function getActiveProducts(): Product[] {
  if (!global.__ELEVEN_PRODUCTS__ || global.__ELEVEN_PRODUCTS__.length === 0) {
    global.__ELEVEN_PRODUCTS__ = loadProductsFromDisk();
  }
  return global.__ELEVEN_PRODUCTS__;
}

/**
 * Asynchronous getter that queries Supabase PostgreSQL first for live real-time data,
 * merging with DEMO_PRODUCTS so that the full catalog is always preserved,
 * while any customized products (like updated photos, prices, stocks, or new products)
 * override the defaults seamlessly.
 */
export async function getActiveProductsAsync(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleClient();
      if (client) {
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          // Map of customized products saved in Supabase
          const supabaseMap = new Map((data as Product[]).map((p) => [p.id, p]));

          // Merge: use Supabase customization if present, otherwise keep demo product
          const merged: Product[] = [];

          for (const demo of DEMO_PRODUCTS) {
            const custom = supabaseMap.get(demo.id);
            if (custom) {
              supabaseMap.delete(demo.id);
              if (custom.nom !== '__DELETED__') {
                merged.push(custom);
              }
            } else {
              merged.push(demo);
            }
          }

          // Add any new products added by the user via Admin that are not in DEMO_PRODUCTS
          for (const extra of supabaseMap.values()) {
            if (extra.nom !== '__DELETED__') {
              merged.unshift(extra);
            }
          }

          global.__ELEVEN_PRODUCTS__ = merged;
          saveProductsToDisk(global.__ELEVEN_PRODUCTS__);
          return merged;
        }
      }
    } catch (err) {
      console.warn('[products-store] Supabase fetch exception:', err);
    }
  }

  return getActiveProducts();
}

/**
 * Saves or updates a product permanently in Supabase PostgreSQL and local cache.
 */
export async function saveProduct(productInput: Partial<Product> & { id?: string }): Promise<Product> {
  const current = await getActiveProductsAsync();
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

  // Sync permanently with Supabase PostgreSQL if configured
  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleClient();
      if (client) {
        const dbPayload = {
          id: updatedProduct.id,
          nom: updatedProduct.nom,
          slug: updatedProduct.slug,
          description: updatedProduct.description || '',
          price_cents: Number(updatedProduct.price_cents),
          image_url: updatedProduct.image_url,
          category_id: updatedProduct.category_id || null,
          is_available: Boolean(updatedProduct.is_available),
          stock: updatedProduct.stock != null ? Number(updatedProduct.stock) : null,
          sort_order: Number(updatedProduct.sort_order ?? 0),
          is_featured: Boolean(updatedProduct.is_featured),
          is_age_restricted: Boolean(updatedProduct.is_age_restricted),
          hero_bg_color: updatedProduct.hero_bg_color || null,
          hero_big_word: updatedProduct.hero_big_word || null,
        };

        // Ensure category exists so foreign key constraint never fails
        if (dbPayload.category_id) {
          try {
            await client.from('categories').upsert(
              {
                id: dbPayload.category_id,
                name: dbPayload.category_id.replace(/^cat-/, '').toUpperCase(),
                slug: dbPayload.category_id.replace(/^cat-/, ''),
                sort_order: 99,
              },
              { onConflict: 'id' }
            );
          } catch {
            // ignore category upsert error
          }
        }

        const { error: upsertErr } = await client.from('products').upsert(dbPayload);
        if (upsertErr) {
          console.warn('[products-store] Supabase product upsert notice:', upsertErr.message);
          // If foreign key constraint failed on category_id, retry with category_id: null
          if (upsertErr.code === '23503' || upsertErr.message?.includes('foreign key')) {
            await client.from('products').upsert({ ...dbPayload, category_id: null });
          }
        }
      }
    } catch (err) {
      console.error('Supabase product upsert error:', err);
    }
  }

  return updatedProduct;
}

/**
 * Deletes a product permanently from Supabase PostgreSQL and local cache.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const current = await getActiveProductsAsync();
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
        await client.from('products').upsert({
          id,
          nom: '__DELETED__',
          slug: `deleted-${id}-${Date.now()}`,
          description: '',
          price_cents: 1,
          image_url: '',
          is_available: false,
        });
      }
    } catch (err) {
      console.error('Supabase product delete error:', err);
    }
  }

  return true;
}
