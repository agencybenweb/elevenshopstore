'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, Truck, CreditCard, Plus, Check, ArrowRight } from 'lucide-react';
import { useCart } from '@/stores/cart';

gsap.registerPlugin(ScrollTrigger);

/* ── 24/7 Banner ─────────────────────────── */
export function OpenBanner() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          once: true,
        },
      },
    );
  }, []);

  return (
    <div ref={ref} className="relative overflow-hidden py-6 md:py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 md:h-14 md:w-14">
          <Clock className="h-5 w-5 text-primary md:h-6 md:w-6" />
        </div>
        <div>
          <p className="font-display text-xl tracking-wide text-white md:text-2xl">
            OUVERT 24H/24
          </p>
          <p className="text-xs text-text-muted md:text-sm">
            7 jours sur 7 — même les jours fériés
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── How it works ────────────────────────── */
const steps = [
  {
    icon: <Clock className="h-7 w-7" />,
    title: 'Parcourez',
    desc: 'Explorez notre catalogue de boissons, snacks et produits du quotidien.',
  },
  {
    icon: <Truck className="h-7 w-7" />,
    title: 'Commandez',
    desc: 'Ajoutez au panier, validez, payez à la livraison.',
  },
  {
    icon: <CreditCard className="h-7 w-7" />,
    title: 'Recevez',
    desc: 'Livraison rapide à Roanne et alentours, à toute heure.',
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.step-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      },
    );
  }, []);

  return (
    <section className="py-8 md:py-12" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <h2 className="mb-8 md:mb-10 text-center font-display text-3xl tracking-wide text-white md:text-4xl">
          COMMENT ÇA MARCHE
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="step-card rounded-3xl border border-border bg-surface-elevated p-8 text-center transition-all hover:border-border-hover hover:shadow-card"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {s.icon}
              </div>
              <h3 className="mb-2 font-display text-xl tracking-wide text-white">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Popular Products ────────────────────── */
const popularProducts = [
  { id: 'energy-monster-strawberry',  name: 'Monster Ultra Strawberry Dreams', priceCents: 290, price: '2,90 €', image: '/products/card-monster-strawberry.png',  tag: '⭐ Top', glow: 'rgba(255, 51, 119, 0.40)' },
  { id: 'energy-redbull-ruby',        name: 'Red Bull Ruby Edition',           priceCents: 320, price: '3,20 €', image: '/products/card-redbull-ruby.png',        tag: '⭐ Top', glow: 'rgba(255, 0, 77, 0.40)' },
  { id: 'snack-takis-blue-heat',      name: 'Takis Blue Heat',                 priceCents: 350, price: '3,50 €', image: '/products/card-takis-blue.png',          tag: 'Tendance', glow: 'rgba(0, 170, 255, 0.45)' },
  { id: 'soda-drpepper-coconut',      name: 'Dr Pepper Creamy Coconut',        priceCents: 250, price: '2,50 €', image: '/products/card-drpepper-coconut.png',    tag: 'Import 🇺🇸', glow: 'rgba(0, 204, 180, 0.40)' },
];

export function PopularProducts() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.pop-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      },
    );
  }, []);

  const handleAdd = (p: typeof popularProducts[0]) => {
    addItem({
      id: p.id,
      name: p.name,
      slug: p.id,
      priceCents: p.priceCents,
      image: p.image,
    }, 1, true);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="pt-6 pb-12 md:pt-8 md:pb-16" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-8 md:mb-10 text-center">
          <h2 className="font-display text-3xl tracking-wide text-white md:text-4xl">
            LES PLUS DEMANDÉS
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Les indispensables de votre nuit, livrés en un éclair.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {popularProducts.map((p) => (
            <div
              key={p.id}
              className="pop-card product-card group relative flex flex-col justify-between p-4 md:p-5 hover:border-primary transition-all duration-300"
            >
              {/* Badge row — cleanly above the image, never overlaps */}
              <div className="flex items-center justify-between w-full h-6 mb-2">
                {p.tag ? (
                  <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-wide">
                    {p.tag}
                  </span>
                ) : (
                  <div />
                )}
              </div>

              {/* Product photo with colored ambient smoke/glow */}
              <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center md:h-36 md:w-36">
                <div
                  className="absolute -inset-1 rounded-full blur-2xl opacity-60 transition-all duration-500 group-hover:scale-115 group-hover:opacity-90 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${p.glow} 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={p.image}
                  alt={p.name}
                  className="relative z-10 h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div>
                <h3 className="truncate text-sm font-semibold text-white">
                  {p.name}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-primary font-mono">
                    {p.price}
                  </span>
                  <button
                    onClick={() => handleAdd(p)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-primary hover:text-black active:scale-95 cursor-pointer"
                    aria-label={`Ajouter ${p.name} au panier`}
                  >
                    {addedId === p.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to full catalogue */}
        <div className="mt-8 md:mt-10 text-center">
          <Link
            href="/catalogue"
            className="btn-pill btn-pill-outline inline-flex items-center gap-2 text-sm px-6 py-2.5 transition-transform hover:scale-105"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
