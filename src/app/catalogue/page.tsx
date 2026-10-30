import type { Metadata } from 'next';
import { getCategories, getProducts, getStoreSettings } from '@/lib/products';
import CatalogueView from '@/components/catalogue/CatalogueView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catalogue — Eleven Shop Roanne | Boissons, Snacks & Épicerie 24h/24',
  description:
    'Découvrez notre catalogue complet disponible en livraison 24h/24 à Roanne : Monster, Red Bull, sodas frais, confiseries, chips, glaces et épicerie.',
};

export default async function CataloguePage() {
  const [categories, products, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getStoreSettings(),
  ]);

  return (
    <CatalogueView
      initialCategories={categories}
      initialProducts={products}
      initialSettings={settings}
    />
  );
}
