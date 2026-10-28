'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/stores/cart';
import { formatPrice } from '@/hooks/use-utils';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    totalItems,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    isMinOrderReached,
    missingForMinOrderCents,
    isFreeDelivery,
    missingForFreeDeliveryCents,
    freeDeliveryProgress,
    hasAgeRestricted,
    minOrderCents,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* ── Backdrop ──────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── Drawer Panel ──────────────────────── */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mon Panier"
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#121212] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out"
      >
        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl tracking-wide text-white">
              MON PANIER
            </h2>
            <span className="badge">{totalItems}</span>
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Free delivery progress bar ───────── */}
        {totalItems > 0 && (
          <div className="border-b border-white/5 bg-surface-muted/60 px-5 py-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {isFreeDelivery ? (
                  <strong className="text-primary">Livraison offerte sur votre commande !</strong>
                ) : (
                  <span>
                    Plus que <strong className="text-white">{formatPrice(missingForFreeDeliveryCents)}</strong> pour la livraison offerte
                  </span>
                )}
              </span>
              <span className="font-mono text-white/50">{freeDeliveryProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Cart Items List / Empty State ───── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/30">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h3 className="font-display text-2xl tracking-wide text-white">
                VOTRE PANIER EST VIDE
              </h3>
              <p className="mt-2 max-w-xs text-sm text-text-muted">
                Découvrez nos boissons fraîches, snacks croustillants et produits de nuit.
              </p>
              <Link
                href="/catalogue"
                onClick={closeDrawer}
                className="btn-pill btn-pill-primary mt-6 text-sm"
              >
                Parcourir le catalogue
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface-elevated/70 p-3 transition-colors hover:border-white/10"
                >
                  {/* Thumbnail */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-black/30 p-1">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="truncate text-sm font-semibold text-white">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-white/40 hover:text-error transition-colors"
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-semibold text-primary text-sm">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center text-white/70 hover:text-white"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-4 text-center font-mono text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center text-white/70 hover:text-white"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer / Checkout Section ────────── */}
        {items.length > 0 && (
          <div className="border-t border-white/10 bg-surface-muted/90 p-5 space-y-3">
            {/* 18+ Warning */}
            {hasAgeRestricted && (
              <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Produit 18+ dans le panier :</strong> Pièce d'identité exigible à la livraison.
                </span>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Sous-total</span>
                <span className="font-mono text-white">{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Livraison (Roanne & agglo)</span>
                {deliveryFeeCents === 0 ? (
                  <span className="font-semibold text-success">Offerte</span>
                ) : (
                  <span className="font-mono text-white">{formatPrice(deliveryFeeCents)}</span>
                )}
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-display text-xl text-white">
                <span>TOTAL</span>
                <span className="text-primary">{formatPrice(totalCents)}</span>
              </div>
            </div>

            {/* Minimum order condition banner */}
            {!isMinOrderReached ? (
              <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-center text-xs text-secondary">
                Minimum de commande : <strong>{formatPrice(minOrderCents)}</strong>
                <br />
                Encore <strong>{formatPrice(missingForMinOrderCents)}</strong> pour pouvoir commander.
              </div>
            ) : null}

            {/* Checkout Action Button */}
            {isMinOrderReached ? (
              <Link
                href="/panier"
                onClick={closeDrawer}
                className="btn-pill btn-pill-primary w-full py-3.5 text-center text-base font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <span>Commander ({formatPrice(totalCents)})</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <button
                disabled
                className="btn-pill w-full py-3.5 text-center text-sm font-semibold bg-white/10 text-white/40 cursor-not-allowed"
              >
                Minimum de {formatPrice(minOrderCents)} requis
              </button>
            )}

            <p className="text-center text-[11px] text-white/40">
              Paiement à la livraison • Espèces ou Carte bancaire
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
