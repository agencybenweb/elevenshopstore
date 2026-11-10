'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/stores/cart';
import { formatPrice } from '@/hooks/use-utils';
import {
  isAlcoholItem,
  isAlcoholCurfewActive,
  getParisTime,
  ALCOHOL_LEGAL_NOTICES,
} from '@/lib/alcohol';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Ban,
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
    removeAlcoholItems,
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
    hasAlcohol,
    alcoholItems,
    minOrderCents,
  } = useCart();

  // Curfew live state (Europe/Paris timezone: 22h - 6h)
  const [curfewActive, setCurfewActive] = useState(false);
  const [currentParisTime, setCurrentParisTime] = useState('');

  useEffect(() => {
    const updateCurfew = () => {
      setCurfewActive(isAlcoholCurfewActive());
      setCurrentParisTime(getParisTime().formatted);
    };
    updateCurfew();
    const interval = setInterval(updateCurfew, 10000);
    return () => clearInterval(interval);
  }, []);

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

    if (hasAlcohol && isAlcoholCurfewActive()) {
      setErrorMessage(
        "Conformément à la réglementation (art. L. 3322-9 CSP), la vente et la livraison d'alcool sont strictement interdites entre 22h00 et 06h00. Veuillez retirer les boissons alcoolisées de votre panier pour finaliser votre commande nocturne."
      );
      return;
    }

    if (hasAgeRestricted && !isAdultConfirmed) {
      setErrorMessage(
        hasAlcohol
          ? 'Veuillez certifier sur l’honneur être majeur(e) (18 ans ou plus) et confirmer que vous présenterez votre pièce d’identité originale au livreur.'
          : 'Veuillez certifier sur l’honneur être majeur(e) (18 ans ou plus).'
      );
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
                      {isAlcoholItem(item) && (
                        <div className="mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                            🔞 18+ Alcool • CNI requise
                          </span>
                        </div>
                      )}
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

              {/* Alcohol Notification in Recap */}
              {hasAlcohol && (
                <div
                  className={`mt-4 rounded-2xl border p-3.5 text-xs transition-all ${
                    curfewActive
                      ? 'border-red-500/40 bg-red-500/10 text-red-200'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span className="flex items-center gap-1.5">
                      {curfewActive ? (
                        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      )}
                      <span className={curfewActive ? 'text-red-400 uppercase tracking-wide' : 'text-amber-400 uppercase tracking-wide'}>
                        {curfewActive ? 'Vente interdite (22h - 6h)' : 'Alcool dans le panier (18+)'}
                      </span>
                    </span>
                    {curfewActive && currentParisTime && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] text-red-300">
                        {currentParisTime}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/80 leading-relaxed">
                    {curfewActive
                      ? 'Conformément à l’art. L. 3322-9 du CSP, la vente et la livraison d’alcool sont interdites entre 22h et 6h. Retirez les boissons alcoolisées pour commander.'
                      : 'Vente interdite entre 22h et 6h. Carte d’identité originale avec photo exigée par le livreur.'}
                  </p>
                  {curfewActive && (
                    <button
                      type="button"
                      onClick={removeAlcoholItems}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Retirer l’alcool du panier</span>
                    </button>
                  )}
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

              {/* ── 18+ Age Verification & Alcohol Regulations ─────────── */}
              {hasAlcohol ? (
                <div className="space-y-4">
                  {/* 1. Notification Vente Interdite 22h - 6h */}
                  {curfewActive ? (
                    <div className="rounded-2xl border border-red-500/50 bg-red-950/40 p-5 shadow-lg backdrop-blur-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                          <Ban className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-red-400 flex items-center gap-2">
                              <span>Vente interdite entre 22h et 6h</span>
                            </h4>
                            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-red-200">
                              {currentParisTime ? `Heure actuelle : ${currentParisTime}` : 'Créneau nocturne restreint'}
                            </span>
                          </div>

                          <p className="text-xs text-white/90 leading-relaxed">
                            Conformément à l’<strong>article L. 3322-9 du Code de la santé publique</strong>, la vente à emporter et la livraison à domicile de boissons alcooliques sont <strong>strictement interdites entre 22h00 et 06h00</strong>.
                          </p>

                          <div className="rounded-xl bg-black/50 p-3 border border-red-500/20 text-xs">
                            <span className="font-semibold text-red-200">Articles soumis à cette interdiction dans votre panier :</span>
                            <ul className="mt-1 list-disc list-inside space-y-0.5 text-white/80">
                              {alcoholItems.map((item) => (
                                <li key={item.id}>
                                  {item.name} <span className="text-white/40">({item.quantity}x)</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <p className="text-xs text-white/80">
                            Pour commander vos boissons sans alcool, confiseries, snacks ou épicerie de nuit, retirez simplement les boissons alcoolisées.
                          </p>

                          <button
                            type="button"
                            onClick={removeAlcoholItems}
                            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Retirer les boissons alcoolisées du panier</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-amber-300">
                              Réglementation horaire : Vente interdite entre 22h et 6h
                            </h4>
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                              Art. L. 3322-9 CSP
                            </span>
                          </div>
                          <p className="text-xs text-white/85 leading-relaxed">
                            Conformément à la réglementation française, la vente et la livraison de boissons alcooliques sont formellement <strong>interdites entre 22h00 et 06h00</strong>. Votre commande sera préparée et livrée dans le respect des créneaux horaires légaux autorisés (06h00 – 22h00).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Notification Carte d'Identité Nécessaire */}
                  <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold uppercase tracking-wide text-warning flex items-center gap-1.5">
                            <span>Carte d’identité originale obligatoire</span>
                          </h4>
                          <span className="rounded-full bg-warning/20 border border-warning/30 px-2 py-0.5 text-[10px] font-bold text-warning">
                            18+ • Art. L. 3342-1 CSP
                          </span>
                        </div>

                        <p className="text-xs text-white/90 leading-relaxed">
                          La vente de boissons alcooliques est <strong>strictement interdite aux mineurs de moins de 18 ans</strong>.
                        </p>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-white/85 space-y-1.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="text-base">🪪</span> Contrôle systématique par le livreur :
                          </div>
                          <p className="text-white/75 leading-relaxed">
                            Une <strong>pièce d’identité officielle physique originale avec photo</strong> (Carte Nationale d’Identité, Passeport ou Permis de conduire) vous sera <strong>obligatoirement demandée et vérifiée par le livreur</strong> avant la remise de votre commande. Les photos sur smartphone ou photocopies sont formellement refusées.
                          </p>
                          <div className="rounded-lg bg-amber-500/15 border border-amber-500/25 p-2 text-[11px] text-amber-200 font-medium">
                            ⚠️ En cas de non-présentation d’un original valide ou si le client est mineur, les boissons alcoolisées seront immédiatement conservées et non livrées.
                          </div>
                        </div>

                        <label className="mt-3 flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-white">
                          <input
                            type="checkbox"
                            required
                            checked={isAdultConfirmed}
                            onChange={(e) => setIsAdultConfirmed(e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-white/20 bg-black text-primary focus:ring-primary"
                          />
                          <span className="leading-snug">
                            Je certifie sur l’honneur être majeur(e) (18 ans ou plus) et je m’engage à présenter ma pièce d’identité originale avec photo au livreur *
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : hasAgeRestricted ? (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
                  <div className="flex items-start gap-3.5">
                    <ShieldAlert className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-warning">
                        Vérification de la majorité (18 ans ou plus)
                      </div>
                      <p className="mt-1 text-xs text-white/80 leading-relaxed">
                        Votre panier comporte des produits réservés aux personnes majeures (18+). Une pièce d’identité originale pourra être exigée par le livreur lors de la livraison.
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
              ) : null}

              {/* ── Submit Button ────────────────── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isMinOrderReached || isSubmitting || (hasAlcohol && curfewActive)}
                  className={`btn-pill btn-pill-primary w-full py-4 text-base font-bold shadow-glow flex items-center justify-center gap-2 ${
                    !isMinOrderReached || isSubmitting || (hasAlcohol && curfewActive)
                      ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-none'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Enregistrement de la commande...</span>
                    </>
                  ) : hasAlcohol && curfewActive ? (
                    <>
                      <Ban className="h-5 w-5" />
                      <span>Vente d'alcool interdite entre 22h et 6h</span>
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
