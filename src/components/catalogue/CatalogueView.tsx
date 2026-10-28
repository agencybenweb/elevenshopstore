'use client';

import { useState, useMemo, useEffect } from 'react';
import { Category, Product, StoreSettings } from '@/types/database';
import { useCart } from '@/stores/cart';
import { useSettings } from '@/stores/settings';
import { formatPrice } from '@/hooks/use-utils';
import {
  Search,
  X,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface CatalogueViewProps {
  initialCategories: Category[];
  initialProducts: Product[];
  initialSettings?: StoreSettings;
}

export default function CatalogueView({
  initialCategories,
  initialProducts,
  initialSettings,
}: CatalogueViewProps) {
  const { items, addItem, updateQuantity, removeItem, openDrawer, totalItems, totalCents } = useCart();
  const { settings } = useSettings(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Live sync products on window focus or visibility change
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.products && Array.isArray(data.products)) {
            setProducts(data.products);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  // Clean up any cart items if their product has been deleted from catalog
  useEffect(() => {
    if (products.length > 0 && items.length > 0) {
      const productIds = new Set(products.map((p) => p.id));
      for (const it of items) {
        if (!productIds.has(it.id)) {
          removeItem(it.id);
        }
      }
    }
  }, [products, items, removeItem]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter category
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    // Filter search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price_cents - b.price_cents);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price_cents - a.price_cents);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.nom.localeCompare(b.nom));
    } else {
      // featured / default
      list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product) => {
    if (!product.is_available) return;
    addItem(
      {
        id: product.id,
        name: product.nom,
        slug: product.slug,
        priceCents: product.price_cents,
        image: product.image_url,
        isAgeRestricted: product.is_age_restricted,
      },
      1,
      false // don't force open drawer every single click, just show feedback
    );
    setRecentAddedId(product.id);
    setTimeout(() => {
      setRecentAddedId(null);
    }, 1200);
  };

  const getItemQuantityInCart = (productId: string) => {
    const found = items.find((i) => i.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen pt-24 pb-28 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Page Header ─────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Livraison de nuit 24h/24 à Roanne
              </div>
              <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">
                LE CATALOGUE
              </h1>
              <p className="mt-1 text-sm text-text-muted md:text-base">
                Boissons bien fraîches, confiseries, apéro et épicerie livrés chez vous en quelques minutes.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-text-muted">
                Minimum de commande :{' '}
                <strong className="text-white" suppressHydrationWarning>
                  {formatPrice(settings.min_order_cents)}
                </strong>
              </span>
              <span className="text-xs text-text-muted">•</span>
              <span className="text-xs text-text-muted">
                Livraison offerte dès{' '}
                <strong className="text-primary" suppressHydrationWarning>
                  {formatPrice(settings.free_delivery_above_cents)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une boisson, un snack, des bonbons..."
              className="w-full rounded-full border border-white/10 bg-surface-elevated pl-11 pr-10 py-2.5 text-sm text-white placeholder-white/40 transition-colors focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-white/40 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-full border border-white/10 bg-surface-elevated px-4 py-2 text-xs font-medium text-white transition-colors focus:border-primary focus:outline-none"
            >
              <option value="featured">Populaires en premier</option>
              <option value="price-asc">Prix : croissant</option>
              <option value="price-desc">Prix : décroissant</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>
        </div>

        {/* ── Category Pills (Horizontal Scroll) ── */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto no-scrollbar sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-black shadow-glow font-bold'
                  : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              ✨ Tout voir ({initialProducts.length})
            </button>
            {initialCategories.map((cat) => {
              const count = initialProducts.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-black shadow-glow font-bold'
                      : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                  <span
                    className={`ml-1 text-[10px] ${
                      isSelected ? 'text-black/60' : 'text-white/40'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Product Grid ────────────────────── */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-surface-elevated p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/40">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl tracking-wide text-white">
              AUCUN PRODUIT TROUVÉ
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Aucun résultat ne correspond à votre recherche. Essayez un autre terme ou réinitialisez les filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn-pill btn-pill-outline mt-6 text-xs"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const qtyInCart = getItemQuantityInCart(p.id);
              const isRecentlyAdded = recentAddedId === p.id;

              return (
                <div
                  key={p.id}
                  className={`product-card group relative flex flex-col justify-between overflow-hidden p-3.5 sm:p-5 transition-all ${
                    !p.is_available
                      ? 'opacity-55 grayscale cursor-not-allowed'
                      : 'hover:border-primary'
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute left-3 top-3 right-3 flex items-start justify-between z-10 pointer-events-none">
                    {p.is_featured && p.is_available && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Flame className="h-3 w-3" />
                        Top
                      </span>
                    )}
                    {p.is_age_restricted && (
                      <span className="flex items-center gap-0.5 rounded-full bg-error/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-error ml-auto">
                        <ShieldAlert className="h-3 w-3" />
                        18+
                      </span>
                    )}
                    {!p.is_available && (
                      <span className="rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-bold text-white/80 border border-white/20">
                        Épuisé
                      </span>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className="relative mx-auto my-3 flex h-32 w-32 items-center justify-center sm:h-44 sm:w-44">
                    <img
                      src={p.image_url}
                      alt={p.nom}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Info & Action */}
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="line-clamp-2 text-xs font-semibold text-white sm:text-sm">
                        {p.nom}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-muted sm:text-xs">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="font-mono text-sm font-bold text-primary sm:text-base">
                          {formatPrice(p.price_cents)}
                        </span>
                      </div>

                      {/* Add to Cart Actions */}
                      {p.is_available ? (
                        qtyInCart > 0 ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5">
                            <button
                              onClick={() => updateQuantity(p.id, qtyInCart - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                              aria-label="Diminuer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-4 text-center font-mono text-xs font-bold text-primary">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateQuantity(p.id, qtyInCart + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                              aria-label="Augmenter"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(p)}
                            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
                              isRecentlyAdded
                                ? 'bg-primary text-black shadow-glow'
                                : 'bg-white/10 text-white hover:bg-primary hover:text-black'
                            }`}
                            aria-label={`Ajouter ${p.nom} au panier`}
                          >
                            {isRecentlyAdded ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-medium text-white/30">
                          Indisponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mobile Floating Cart Bar ──────────── */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={openDrawer}
            className="flex w-full items-center justify-between rounded-full bg-primary p-3.5 pl-5 pr-4 text-black shadow-2xl transition-transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-bold text-sm">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-mono font-bold text-sm">
                {formatPrice(totalCents)}
              </span>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
              <span>Voir le panier</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
