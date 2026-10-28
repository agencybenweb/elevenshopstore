'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Order } from '@/types/database';
import { formatPrice } from '@/hooks/use-utils';
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Phone,
  Copy,
  Check,
  ShoppingBag,
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  Loader2,
  Sparkles,
  Radio,
} from 'lucide-react';

/* ── Web Audio Chime Synthesizer ─────────── */
function playStatusChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Autoplay restrictions
  }
}

const STATUS_DESCRIPTIONS: Record<
  Order['status'],
  { title: string; subtitle: string; icon: any }
> = {
  new: {
    title: 'Commande reçue & enregistrée',
    subtitle:
      'Votre commande a été transmise au magasin. Un livreur va la prendre en charge.',
    icon: Clock,
  },
  taken: {
    title: 'Prise en charge par le livreur',
    subtitle:
      'Le livreur prépare vos articles et s\'apprête à partir.',
    icon: ShoppingBag,
  },
  delivering: {
    title: 'En route vers votre adresse !',
    subtitle:
      'Le livreur est en déplacement vers chez vous. Préparez votre règlement.',
    icon: Truck,
  },
  delivered: {
    title: 'Commande livrée !',
    subtitle:
      'Votre commande a été remise avec succès. Merci et bonne dégustation !',
    icon: PackageCheck,
  },
  cancelled: {
    title: 'Commande annulée',
    subtitle:
      'Cette commande a été annulée. Contactez le magasin si besoin.',
    icon: CheckCircle2,
  },
};

export default function ConfirmationContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolved = use(params);
  const code = resolved.code;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusUpdateToast, setStatusUpdateToast] = useState<{
    text: string;
    step: number;
  } | null>(null);

  const prevStatusRef = useRef<Order['status'] | null>(null);
  const isFirstLoadRef = useRef(true);

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return 1;
      case 'taken':
        return 2;
      case 'delivering':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const fetchOrder = useCallback(
    async (isInitial = false) => {
      try {
        const res = await fetch(`/api/orders/${code}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          const updatedOrder: Order = data.order;

          if (updatedOrder) {
            // Detect status changes and notify
            if (
              !isFirstLoadRef.current &&
              prevStatusRef.current &&
              prevStatusRef.current !== updatedOrder.status
            ) {
              playStatusChime();
              const statusStep = getStatusStep(updatedOrder.status);
              const label =
                STATUS_DESCRIPTIONS[updatedOrder.status]?.title ||
                'Statut mis à jour';
              setStatusUpdateToast({ text: label, step: statusStep });
              setTimeout(() => setStatusUpdateToast(null), 7000);
            }

            prevStatusRef.current = updatedOrder.status;
            isFirstLoadRef.current = false;
            setOrder(updatedOrder);
          }
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [code]
  );

  // Auto-polling live update every 2.5 seconds
  useEffect(() => {
    fetchOrder(true);

    const interval = setInterval(() => {
      // Keep polling while order is active
      if (
        !order ||
        (order.status !== 'delivered' && order.status !== 'cancelled')
      ) {
        fetchOrder(false);
      }
    }, 2500);

    // Instant check when switching tabs back to this page
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [fetchOrder, order?.status]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStep = order ? getStatusStep(order.status) : 1;

  return (
    <div className="min-h-screen pt-24 pb-28 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* ── Success Header ──────────────────── */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-glow">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-2">
            Commande enregistrée avec succès
          </span>
          <h1 className="font-display text-3xl tracking-wide text-white md:text-5xl">
            MERCI POUR VOTRE COMMANDE !
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Le patron et les livreurs d'Eleven Shop ont été notifiés sur Telegram.
          </p>

          {/* Code pill */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-surface-elevated px-5 py-2.5">
            <span className="text-xs text-text-muted uppercase tracking-wider">
              Code de suivi :
            </span>
            <span className="font-mono text-base font-bold text-primary">
              #{code}
            </span>
            <button
              onClick={copyCode}
              className="ml-2 flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20 transition-colors"
              title="Copier le code"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-primary" />
                  <span className="text-primary">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Stepper with Live Auto-Updates ───── */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-8 relative overflow-hidden shadow-card">
          {/* Header row with Live Badge */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 flex-wrap gap-2">
            <div>
              <h2 className="font-display text-base uppercase tracking-wider text-white">
                Suivi de livraison
              </h2>
              <p className="text-[11px] text-text-muted">
                Actualisation automatique en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-[11px] font-bold text-success shadow-sm">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span>En direct</span>
              </span>
            </div>
          </div>

          {/* Toast Notification when status advances */}
          {statusUpdateToast && (
            <div className="mb-6 rounded-2xl bg-primary/20 border border-primary/40 px-4 py-3 text-center text-xs font-bold text-white flex items-center justify-center gap-2 animate-bounce shadow-glow">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>Nouveau statut : {statusUpdateToast.text}</span>
            </div>
          )}

          {/* Stepper with progress bar */}
          <div className="relative mb-6">
            {/* Background track line */}
            <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-white/10 -translate-y-1/2 z-0 rounded-full" />
            {/* Active progress line */}
            <div
              className="absolute top-5 left-[12%] h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-out shadow-glow"
              style={{
                width:
                  currentStep === 1
                    ? '0%'
                    : currentStep === 2
                    ? '38%'
                    : currentStep === 3
                    ? '74%'
                    : '76%',
              }}
            />

            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {/* Step 1: Reçue */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-500 ${
                    currentStep >= 1
                      ? 'border-primary bg-primary text-black shadow-glow'
                      : 'border-white/10 bg-white/5 text-white/40'
                  } ${currentStep === 1 ? 'ring-4 ring-primary/25 animate-pulse' : ''}`}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    currentStep >= 1 ? 'text-white' : 'text-white/40'
                  }`}
                >
                  Reçue
                </span>
                <span className="text-[10px] text-text-muted hidden sm:inline">
                  Enregistrée
                </span>
              </div>

              {/* Step 2: Prise en charge */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-500 ${
                    currentStep >= 2
                      ? 'border-primary bg-primary text-black shadow-glow'
                      : 'border-white/10 bg-white/5 text-white/40'
                  } ${currentStep === 2 ? 'ring-4 ring-primary/25 animate-pulse' : ''}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    currentStep >= 2 ? 'text-white' : 'text-white/40'
                  }`}
                >
                  Prise en charge
                </span>
                <span className="text-[10px] text-text-muted hidden sm:inline">
                  Par le livreur
                </span>
              </div>

              {/* Step 3: En route */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-500 ${
                    currentStep >= 3
                      ? 'border-primary bg-primary text-black shadow-glow'
                      : 'border-white/10 bg-white/5 text-white/40'
                  } ${currentStep === 3 ? 'ring-4 ring-primary/25 animate-pulse' : ''}`}
                >
                  <Truck className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    currentStep >= 3 ? 'text-white' : 'text-white/40'
                  }`}
                >
                  En route
                </span>
                <span className="text-[10px] text-text-muted hidden sm:inline">
                  Vers chez vous
                </span>
              </div>

              {/* Step 4: Livrée */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-500 ${
                    currentStep >= 4
                      ? 'border-primary bg-primary text-black shadow-glow'
                      : 'border-white/10 bg-white/5 text-white/40'
                  } ${currentStep === 4 ? 'ring-4 ring-primary/25' : ''}`}
                >
                  <PackageCheck className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    currentStep >= 4 ? 'text-white' : 'text-white/40'
                  }`}
                >
                  Livrée
                </span>
                <span className="text-[10px] text-text-muted hidden sm:inline">
                  Bonne dégustation
                </span>
              </div>
            </div>
          </div>

          {/* Current Status Message Box */}
          {order && (
            <div className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  {currentStep === 1 && <Clock className="h-5 w-5" />}
                  {currentStep === 2 && <ShoppingBag className="h-5 w-5" />}
                  {currentStep === 3 && <Truck className="h-5 w-5 animate-bounce" />}
                  {currentStep === 4 && <PackageCheck className="h-5 w-5 text-success" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {STATUS_DESCRIPTIONS[order.status]?.title || 'Suivi en cours'}
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {STATUS_DESCRIPTIONS[order.status]?.subtitle}
                  </p>
                </div>
              </div>

              {order.assigned_driver && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-semibold ml-auto">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Livreur : {order.assigned_driver}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Order Details Card ──────────────── */}
        {loading ? (
          <div className="mt-8 flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-8 space-y-6">
              <h3 className="font-display text-xl tracking-wide text-white border-b border-white/10 pb-4">
                DÉTAIL DE LA COMMANDE
              </h3>

              {/* Destination */}
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-muted block mb-1">
                    Destinataire
                  </span>
                  <p className="font-semibold text-white">{order.client_name}</p>
                  <a
                    href={`tel:${order.client_phone.replace(/\s+/g, '')}`}
                    className="font-mono text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="h-3 w-3" />
                    {order.client_phone}
                  </a>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-text-muted block mb-1">
                    Adresse de livraison
                  </span>
                  <p className="font-semibold text-white flex items-start gap-1">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      {order.address}, {order.postal_code} {order.city}
                    </span>
                  </p>
                  {order.address_extra && (
                    <p className="text-xs text-text-muted mt-1">
                      {order.address_extra}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-3 text-xs text-text-muted">
                  <strong className="text-white">Remarque livreur :</strong> {order.notes}
                </div>
              )}

              {/* Payment Mode */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/30 p-3 text-xs">
                {order.payment_method === 'cash' ? (
                  <>
                    <Banknote className="h-4 w-4 text-primary" />
                    <span>
                      Paiement en <strong>Espèces</strong> à la livraison
                    </span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>
                      Paiement par <strong>Carte bancaire</strong> à la livraison (TPE sans contact)
                    </span>
                  </>
                )}
              </div>

              {/* Items List */}
              {order.items && order.items.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-muted block mb-3">
                    Articles commandés
                  </span>
                  <div className="divide-y divide-white/5 space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex justify-between text-xs sm:text-sm">
                        <span className="text-white">
                          <strong className="font-mono text-primary mr-2">{it.quantity}×</strong>
                          {it.product_name}
                        </span>
                        <span className="font-mono text-white/80">
                          {formatPrice(it.price_cents * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-white/10 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Sous-total</span>
                  <span className="font-mono text-white">{formatPrice(order.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Frais de livraison</span>
                  {order.delivery_fee_cents === 0 ? (
                    <span className="font-semibold text-success">Offert</span>
                  ) : (
                    <span className="font-mono text-white">{formatPrice(order.delivery_fee_cents)}</span>
                  )}
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-display text-2xl text-white">
                  <span>TOTAL À RÉGLER</span>
                  <span className="text-primary">{formatPrice(order.total_cents)}</span>
                </div>
              </div>
            </div>

            {/* Direct support action */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="tel:0600000000"
                className="btn-pill btn-pill-outline flex-1 text-center text-sm py-3 flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span>Appeler l'épicerie Eleven Shop</span>
              </a>

              <Link
                href="/catalogue"
                className="btn-pill btn-pill-primary flex-1 text-center text-sm py-3 flex items-center justify-center gap-2"
              >
                <span>Retour au catalogue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
