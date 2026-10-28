'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import { heroSlides, type HeroSlide } from '@/config/hero-slides';
import { formatPrice } from '@/hooks/use-utils';
import { useCart } from '@/stores/cart';

const AUTOPLAY_MS = 6500;

export default function HeroCarousel() {
  const { addItem } = useCart();
  const [current, setCurrent] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [paused, setPaused] = useState(false);

  /* ── Refs ────────────────────────────────── */
  const containerRef         = useRef<HTMLDivElement>(null);
  const currentBgRef         = useRef<HTMLDivElement>(null);
  const incomingBgRef        = useRef<HTMLDivElement>(null);
  const canWrapperRef        = useRef<HTMLDivElement>(null);
  const canRef               = useRef<HTMLImageElement>(null);
  const shadowRef            = useRef<HTMLDivElement>(null);
  const wordInnerRef         = useRef<HTMLDivElement>(null);
  const tagRef               = useRef<HTMLDivElement>(null);
  const floatingGroupRef     = useRef<HTMLDivElement>(null);
  const productCardRef       = useRef<HTMLDivElement>(null);
  const previewBubbleRef     = useRef<HTMLButtonElement>(null);
  const touchStart           = useRef(0);
  const autoplayRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTweenRef         = useRef<gsap.core.Timeline | null>(null);

  const slide = heroSlides[current];
  const nextSlide = heroSlides[(current + 1) % heroSlides.length];
  const prevSlide = heroSlides[(current - 1 + heroSlides.length) % heroSlides.length];

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Idle floating levitation ──────────── */
  useEffect(() => {
    if (prefersReducedMotion || !canWrapperRef.current || !shadowRef.current) return;

    if (idleTweenRef.current) idleTweenRef.current.kill();

    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(canWrapperRef.current, {
      y: -14,
      rotationZ: 2,
      rotationY: -3,
      duration: 3,
      ease: 'sine.inOut',
    });
    tl.to(
      shadowRef.current,
      {
        scale: 0.88,
        opacity: 0.35,
        duration: 3,
        ease: 'sine.inOut',
      },
      0,
    );

    idleTweenRef.current = tl;
    return () => {
      tl.kill();
    };
  }, [current, prefersReducedMotion]);

  /* ── 2. Interactive 3D mouse parallax ─────── */
  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;
    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      if (canRef.current) {
        gsap.to(canRef.current, {
          rotationY: x * 16,
          rotationX: -y * 12,
          x: x * 20,
          y: y * 15,
          duration: 0.6,
          ease: 'power2.out',
        });
      }

      if (wordInnerRef.current) {
        gsap.to(wordInnerRef.current, {
          x: -x * 25,
          y: -y * 15,
          duration: 0.8,
          ease: 'power2.out',
        });
      }

      if (floatingGroupRef.current) {
        const items = floatingGroupRef.current.children;
        for (let i = 0; i < items.length; i++) {
          const depth = Number((items[i] as HTMLElement).dataset.depth || '0.5');
          gsap.to(items[i], {
            x: x * depth * 50,
            y: y * depth * 40,
            duration: 0.7,
            ease: 'power2.out',
          });
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  /* ── 3. The 3D Switch Transition ─────────── */
  const goTo = useCallback(
    (targetIndex: number, dir: 1 | -1 = 1) => {
      if (isAnimating || targetIndex === current) return;
      setIsAnimating(true);
      setIncomingIndex(targetIndex);

      const incomingSlide = heroSlides[targetIndex];

      // Origin point for the circular reveal wipe (right arrow side or left side)
      const originX = dir === 1 ? '90%' : '10%';
      const originY = '50%';

      if (incomingBgRef.current) {
        gsap.set(incomingBgRef.current, {
          backgroundColor: incomingSlide.bgColor,
          clipPath: `circle(0% at ${originX} ${originY})`,
          zIndex: 2,
          opacity: 1,
        });
      }

      const tl = gsap.timeline({
        onComplete: () => {
          // Sync current background
          if (currentBgRef.current) {
            gsap.set(currentBgRef.current, {
              backgroundColor: incomingSlide.bgColor,
            });
          }
          if (incomingBgRef.current) {
            gsap.set(incomingBgRef.current, {
              clipPath: `circle(0% at ${originX} ${originY})`,
              zIndex: 1,
            });
          }
          setIsAnimating(false);
        },
      });

      /* A. Background circular sweep reveal */
      if (incomingBgRef.current) {
        tl.to(
          incomingBgRef.current,
          {
            clipPath: `circle(150% at ${originX} ${originY})`,
            duration: 0.85,
            ease: 'power3.inOut',
          },
          0,
        );
      }

      /* B. Outgoing can dive & spin */
      if (canRef.current) {
        tl.to(
          canRef.current,
          {
            scale: 0.68,
            rotationY: dir * 50,
            rotationZ: -dir * 15,
            y: 120,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
          },
          0,
        );
      }

      /* C. Outgoing floating items explosion */
      if (floatingGroupRef.current) {
        tl.to(
          floatingGroupRef.current.children,
          {
            scale: 0.4,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
            stagger: 0.02,
          },
          0,
        );
      }

      /* D. Outgoing typography & tag */
      if (wordInnerRef.current) {
        tl.to(
          wordInnerRef.current,
          {
            y: dir === 1 ? -90 : 90,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
          },
          0,
        );
      }
      if (tagRef.current) {
        tl.to(tagRef.current, { opacity: 0, y: -10, duration: 0.25 }, 0);
      }

      /* E. Outgoing product card */
      if (productCardRef.current) {
        tl.to(
          productCardRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
          },
          0,
        );
      }

      /* F. Right preview bubble spin */
      if (previewBubbleRef.current) {
        tl.to(
          previewBubbleRef.current,
          {
            scale: 0.8,
            opacity: 0.5,
            rotation: dir * 45,
            duration: 0.35,
            ease: 'power2.in',
          },
          0,
        );
      }

      /* ── Halfway switch: update state & animate IN ── */
      tl.add(() => {
        setCurrent(targetIndex);
      }, 0.42);

      /* G. Incoming can dramatic 3D entrance */
      tl.add(() => {
        if (canRef.current) {
          gsap.fromTo(
            canRef.current,
            {
              scale: 0.55,
              rotationY: -dir * 65,
              rotationZ: dir * 18,
              y: -110,
              opacity: 0,
            },
            {
              scale: 1,
              rotationY: 0,
              rotationZ: 0,
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'back.out(1.4)',
            },
          );
        }

        /* H. Incoming floating elements fly in */
        if (floatingGroupRef.current) {
          gsap.fromTo(
            floatingGroupRef.current.children,
            {
              scale: 0.2,
              opacity: 0,
              y: 30,
            },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.04,
              ease: 'back.out(1.5)',
            },
          );
        }

        /* I. Incoming typography */
        if (wordInnerRef.current) {
          gsap.fromTo(
            wordInnerRef.current,
            { y: dir === 1 ? 90 : -90, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          );
        }
        if (tagRef.current) {
          gsap.fromTo(
            tagRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
          );
        }

        /* J. Incoming product card */
        if (productCardRef.current) {
          gsap.fromTo(
            productCardRef.current,
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
          );
        }

        /* K. Incoming preview bubble reset */
        if (previewBubbleRef.current) {
          gsap.fromTo(
            previewBubbleRef.current,
            { scale: 0.8, opacity: 0.5, rotation: -dir * 45 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.4)' },
          );
        }
      }, 0.45);
    },
    [current, isAnimating],
  );

  const next = useCallback(() => {
    goTo((current + 1) % heroSlides.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + heroSlides.length) % heroSlides.length, -1);
  }, [current, goTo]);

  /* ── Autoplay ────────────────────────────── */
  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    autoplayRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [next, paused, prefersReducedMotion]);

  /* ── Touch / swipe ────────────────────────── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 40) {
      diff < 0 ? next() : prev();
    }
    setPaused(false);
  };

  /* ── Keyboard navigation ─────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  /* ── Add to cart action ───────────────────── */
  const handleAddToCart = () => {
    addItem(
      {
        id: slide.id,
        name: slide.productName,
        slug: slide.slug,
        priceCents: slide.priceCents,
        image: slide.image,
      },
      1,
      true,
    );
  };

  const incomingSlideData = heroSlides[incomingIndex];

  return (
    <section
      ref={containerRef}
      className="hero-section relative select-none overflow-hidden"
      style={{ perspective: '1200px' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrousel"
      aria-label="Produits vedettes Eleven Shop"
    >
      {/* ── 1. Current background panel ──────────── */}
      <div
        ref={currentBgRef}
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: slide.bgColor, zIndex: 0 }}
      >
        {/* Soft radial highlight behind the central product */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.22) 0%, transparent 65%)`,
          }}
        />
      </div>

      {/* ── 2. Incoming background panel (circular reveal) ── */}
      <div
        ref={incomingBgRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: incomingSlideData.bgColor,
          clipPath: 'circle(0% at 90% 50%)',
          zIndex: 1,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.22) 0%, transparent 65%)`,
          }}
        />
      </div>

      {/* ── 3. Subtle noise overlay for texture ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          zIndex: 3,
          opacity: 0.6,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── 4. Vignette shading at edges ─────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.45) 100%)',
          zIndex: 4,
        }}
      />

      {/* ── 5. Big 3D Typography (Behind product) ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
        style={{ zIndex: 5 }}
        aria-hidden="true"
      >
        {/* Category tag — positioned above the can's top rim */}
        <div
          ref={tagRef}
          className="absolute top-[17%] md:top-[19%] px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-widest uppercase text-white/95 bg-white/15 backdrop-blur-md border border-white/25 flex items-center gap-1.5 shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-white/90" />
          <span>{slide.categoryTag}</span>
        </div>

        {/* Big stylized word */}
        <div
          ref={wordInnerRef}
          className="hero-big-word w-full text-center"
          style={{
            color: slide.wordColor,
            textShadow: '0 12px 45px rgba(0, 0, 0, 0.28)',
          }}
        >
          {slide.bigWord}
        </div>
      </div>

      {/* ── 6. Floating 3D elements (Fruits, Ice, Drops) ── */}
      <div
        ref={floatingGroupRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 6 }}
      >
        {slide.floatingElements.map((el, i) => (
          <div
            key={`${slide.id}-float-${i}`}
            data-depth={el.depth}
            className="absolute transition-transform will-change-transform"
            style={{
              left: el.initialX,
              top: el.initialY,
              width: `${el.size}px`,
              height: `${el.size}px`,
              transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
              filter:
                el.depth < 0.4
                  ? 'blur(2px) drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
                  : 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))',
              opacity: el.depth < 0.4 ? 0.75 : 0.95,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={el.src}
              alt={el.alt}
              className="w-full h-full object-contain animate-float"
              style={{
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3.5 + i * 0.5}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── 7. Central 3D Can + Ellipse Shadow ───── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 7 }}
      >
        <div
          ref={canWrapperRef}
          className="relative flex flex-col items-center justify-center will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Can cutout image — 100% transparent PNG */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={canRef}
            src={slide.image}
            alt={slide.productName}
            className="hero-can pointer-events-auto cursor-grab active:cursor-grabbing select-none"
            style={{
              height: 'clamp(310px, 66vh, 620px)',
              width: 'auto',
              maxWidth: '85vw',
              objectFit: 'contain',
              filter: 'drop-shadow(0 30px 45px rgba(0, 0, 0, 0.45))',
              willChange: 'transform',
            }}
          />

          {/* Ellipse ground shadow beneath the can */}
          <div
            ref={shadowRef}
            className="pointer-events-none rounded-full"
            style={{
              width: 'clamp(180px, 35vw, 280px)',
              height: '24px',
              marginTop: '-12px',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 72%)',
              filter: 'blur(4px)',
            }}
          />
        </div>
      </div>

      {/* ── 8. Right-Side "Next Slide" Preview Bubble (From Video) ── */}
      <button
        ref={previewBubbleRef}
        type="button"
        onClick={next}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center group cursor-pointer"
        style={{ zIndex: 12 }}
        aria-label={`Passer à ${nextSlide.productName}`}
      >
        <div className="relative w-24 h-24 rounded-full border border-white/25 bg-black/25 backdrop-blur-xl shadow-2xl flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
          {/* Rotating dashed ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-white/30 animate-[spin_12s_linear_infinite]" />

          {/* Mini preview of next product */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nextSlide.image}
            alt={nextSlide.productName}
            className="w-14 h-18 object-contain drop-shadow-lg transition-transform duration-300 group-hover:-translate-y-1"
          />

          {/* Next icon badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <span className="mt-2 text-[11px] font-semibold tracking-wider text-white/80 uppercase drop-shadow group-hover:text-white transition-colors">
          Suivant
        </span>
      </button>

      {/* ── 9. Arrow navigation controls (Left / Right) ── */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 md:w-13 md:h-13 rounded-full border border-white/20 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
        style={{ zIndex: 12 }}
        aria-label="Produit précédent"
      >
        <ChevronLeft className="w-6 h-6 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={next}
        className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
        style={{ zIndex: 12 }}
        aria-label="Produit suivant"
      >
        <ChevronRight className="w-6 h-6 stroke-[2]" />
      </button>

      {/* ── 10. Bottom-Left Floating Product Card (From Video) ── */}
      <div
        ref={productCardRef}
        className="absolute bottom-10 left-3 right-3 md:right-auto md:bottom-10 md:left-12 max-w-[calc(100vw-1.5rem)] md:max-w-md"
        style={{ zIndex: 12 }}
      >
        <div className="bg-white/95 text-zinc-900 rounded-2xl md:rounded-3xl p-3.5 md:p-5 shadow-2xl backdrop-blur-xl border border-white/50 flex items-center gap-3 md:gap-4 transition-all">
          {/* Mini product thumbnail */}
          <div className="w-12 h-14 md:w-16 md:h-20 shrink-0 flex items-center justify-center bg-zinc-100/80 rounded-xl md:rounded-2xl p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.productName}
              className="w-full h-full object-contain drop-shadow"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase text-zinc-500 block truncate">
              {slide.tagline}
            </span>
            <h2 className="text-xs md:text-base font-extrabold text-zinc-900 leading-tight truncate">
              {slide.productName}
            </h2>
            <div className="flex items-center gap-2 md:gap-3 mt-1">
              <span className="text-sm md:text-lg font-black text-zinc-950 font-mono">
                {formatPrice(slide.priceCents)}
              </span>
              <span className="text-[9px] md:text-[10px] text-zinc-400 font-medium">Livré en 30 min</span>
            </div>
          </div>

          {/* CTA Add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="shrink-0 px-3.5 py-2 md:px-4 md:py-2.5 rounded-full font-bold text-xs md:text-sm text-white shadow-lg flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: slide.accentColor,
              boxShadow: `0 8px 20px -4px ${slide.accentColor}80`,
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Commander</span>
          </button>
        </div>
      </div>

      {/* ── 11. Bottom Center Pagination Dots ────── */}
      <div
        className="absolute bottom-2.5 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
        style={{ zIndex: 13 }}
        role="tablist"
        aria-label="Navigation des slides"
      >
        {heroSlides.map((s, idx) => {
          const isActive = idx === current;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(idx, idx > current ? 1 : -1)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Aller au produit ${idx + 1}`}
              className="group py-2 px-1 cursor-pointer focus:outline-none"
            >
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-9 bg-white shadow-lg'
                    : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ── 12. Slide counter top right ──────────── */}
      <div
        className="absolute top-6 right-6 text-xs font-mono text-white/70 tracking-widest hidden sm:block"
        style={{ zIndex: 12 }}
      >
        0{current + 1} / 0{heroSlides.length}
      </div>
    </section>
  );
}
