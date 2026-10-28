'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/stores/cart';
import { formatPrice } from '@/hooks/use-utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ShieldAlert,
  Truck,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function CheckoutView() {
  const router = useRouter();
  const {
    items,
    mounted,
    updateQuantity,
    removeItem,
    clearCart,
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

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('42300');
  const [city, setCity] = useState('Roanne');
  const [addressExtra, setAddressExtra] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill city on common postal codes
  const handlePostalCodeChange = (val: string) => {
    setPostalCode(val);
    if (val === '42300') setCity('Roanne');
    else if (val === '42120') setCity('Le Coteau');
    else if (val === '42370') setCity('Renaison');
    else if (val === '42153') setCity('Riorges');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalItems === 0) {
      setErrorMessage('Votre panier est vide.');
      return;
    }

    if (!isMinOrderReached) {
      setErrorMessage(`Le minimum de commande est de ${formatPrice(minOrderCents)}.`);
      return;
    }

    if (hasAgeRestricted && !isAdultConfirmed) {
      setErrorMessage('Veuillez certifier sur l’honneur être majeur(e) (18 ans ou plus).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        client_name: clientName,
        client_phone: clientPhone,
        address,
        postal_code: postalCode,
        city,
        address_extra: addressExtra,
        notes,
        payment_method: paymentMethod,
        is_adult_confirmed: isAdultConfirmed,
        honeypot,
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Une erreur est survenue lors de la commande.');
      }

      // Success: clear cart and redirect to confirmation
      clearCart();
      router.push(`/confirmation/${data.public_code}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue. Veuillez vérifier vos informations.');
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-24 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-white/40">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h1 className="font-display text-4xl tracking-wide text-white">
          VOTRE PANIER EST VIDE
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Ajoutez des boissons, snacks ou confiseries pour passer votre commande nocturne.
        </p>
        <Link
          href="/catalogue"
          className="btn-pill btn-pill-primary mt-8 inline-flex items-center gap-2 text-base font-bold"
        >
          <span>Découvrir le catalogue</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-28 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Title ───────────────────────────── */}
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-wide text-white md:text-5xl">
            VOTRE COMMANDE
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Vérifiez vos articles et renseignez votre adresse de livraison à Roanne.
          </p>
        </div>

        {/* ── Error Banner ────────────────────── */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* ── LEFT: Cart Items Recap (5 cols) ─── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-surface-elevated p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="font-display text-xl tracking-wide text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  RÉCAPITULATIF ({totalItems})
                </h2>
                <Link
                  href="/catalogue"
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  + Ajouter d'autres produits
                </Link>
              </div>

              {/* Free delivery bar */}
              <div className="mb-5 rounded-2xl border border-white/5 bg-white/5 p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-white/90">
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

              {/* Items List */}
              <div className="divide-y divide-white/5 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-black/40 p-1 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-xs font-semibold text-white sm:text-sm">
                        {item.name}
                      </h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">
                          {formatPrice(item.priceCents * item.quantity)}
                        </span>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-white/60 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-4 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-white/60 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-white/30 hover:text-error transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Price Totals */}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Sous-total</span>
                  <span className="font-mono text-white">{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Frais de livraison</span>
                  {deliveryFeeCents === 0 ? (
                    <span className="font-semibold text-success">Offert</span>
                  ) : (
                    <span className="font-mono text-white">{formatPrice(deliveryFeeCents)}</span>
                  )}
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-display text-2xl text-white">
                  <span>TOTAL</span>
                  <span className="text-primary">{formatPrice(totalCents)}</span>
                </div>
              </div>

              {/* Minimum Order Alert */}
              {!isMinOrderReached && (
                <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-center text-xs text-secondary">
                  Minimum de commande : <strong>{formatPrice(minOrderCents)}</strong>
                  <br />
                  Il manque <strong>{formatPrice(missingForMinOrderCents)}</strong> d'articles pour commander.
                </div>
              )}
            </div>

            {/* Quick Guarantees */}
            <div className="rounded-2xl border border-white/5 bg-surface-muted/50 p-4 text-xs text-text-muted space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Truck className="h-4 w-4 text-primary" />
                <span>Livraison nocturne express à Roanne et communes proches.</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Paiement sécurisé à la réception (Carte bancaire ou Espèces).</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Checkout Form (7 cols) ───── */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-8 space-y-6"
            >
              {/* Anti-spam honeypot (hidden) */}
              <input
                type="text"
                name="honeypot"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* ── Contact Section ──────────────── */}
              <div>
                <h3 className="font-display text-lg tracking-wide text-white mb-3">
                  1. COORDONNÉES
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Jean Dupont"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Numéro de téléphone * (pour le livreur)
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: 06 12 34 56 78"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Address Section ──────────────── */}
              <div>
                <h3 className="font-display text-lg tracking-wide text-white mb-3">
                  2. ADRESSE DE LIVRAISON (ROANNE & AGGLO)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Adresse complète (Numéro et Rue) *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: 14 rue de la République"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        Code Postal *
                      </label>
                      <select
                        value={postalCode}
                        onChange={(e) => handlePostalCodeChange(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                      >
                        <option value="42300">42300 — Roanne / Mably</option>
                        <option value="42120">42120 — Le Coteau / Commelle-Vernay</option>
                        <option value="42153">42153 — Riorges</option>
                        <option value="42370">42370 — Renaison / Saint-Alban</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Complément d'adresse (Bâtiment, étage, code porte, interphone...)
                    </label>
                    <input
                      type="text"
                      value={addressExtra}
                      onChange={(e) => setAddressExtra(e.target.value)}
                      placeholder="Ex: Bâtiment B, 3ème étage, code A1234, interphone Dupont"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Instructions particulières pour le livreur
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Appelez-moi quand vous êtes en bas, ne sonnez pas svp."
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Payment Method Section ───────── */}
              <div>
                <h3 className="font-display text-lg tracking-wide text-white mb-3">
                  3. PAIEMENT À LA LIVRAISON
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        paymentMethod === 'cash'
                          ? 'bg-primary text-black'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Espèces</div>
                      <div className="text-xs text-text-muted">Préparez l'appoint si possible</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        paymentMethod === 'card'
                          ? 'bg-primary text-black'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Carte bancaire</div>
                      <div className="text-xs text-text-muted">Terminal TPE sans contact</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── 18+ Age Verification ─────────── */}
              {hasAgeRestricted && (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-warning">
                        Vérification de la majorité (18 ans ou plus)
                      </div>
                      <p className="mt-1 text-xs text-white/80 leading-relaxed">
                        Votre panier comporte des boissons soumises à la réglementation sur l'alcool.
                        La vente est interdite aux mineurs. Une pièce d’identité pourra être exigée par le livreur.
                      </p>
                      <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                        <input
                          type="checkbox"
                          required={hasAgeRestricted}
                          checked={isAdultConfirmed}
                          onChange={(e) => setIsAdultConfirmed(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-black text-primary focus:ring-primary"
                        />
                        <span>Je certifie sur l’honneur être majeur(e) (18 ans ou plus) *</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Submit Button ────────────────── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isMinOrderReached || isSubmitting}
                  className={`btn-pill btn-pill-primary w-full py-4 text-base font-bold shadow-glow flex items-center justify-center gap-2 ${
                    !isMinOrderReached || isSubmitting
                      ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-none'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Enregistrement de la commande...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer ma commande • {formatPrice(totalCents)}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-white/40">
                  En validant votre commande, vous acceptez nos CGV et notre politique de confidentialité.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
