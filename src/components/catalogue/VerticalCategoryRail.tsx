'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/types/database';

interface VerticalCategoryRailProps {
  categories: Category[];
  totalProductsCount: number;
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  productCounts: Record<string, number>;
}

export default function VerticalCategoryRail({
  categories,
  totalProductsCount,
  activeCategory,
  onSelectCategory,
  productCounts,
}: VerticalCategoryRailProps) {
  // Strictly ONE single label can EVER be active at a time (from click or PC hover)
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [isRetracted, setIsRetracted] = useState<boolean>(false);
  // PC: index of the bubble under the cursor, drives the macOS-dock style magnification
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isRetractedRef = useRef<boolean>(false);
  const retractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const isClickActionRef = useRef<boolean>(false);

  // Fast-scroll handle (phone): the retracted droplet doubles as a scrubber.
  // It sits on a track along the right edge at the page's scroll progress; dragging it scrolls the page.
  const HANDLE_TRACK_TOP = 110; // below the header
  const HANDLE_TRACK_BOTTOM = 110; // above the floating cart bar
  const handleRef = useRef<HTMLButtonElement>(null);
  // aisle under the finger while scrubbing (index into the catalogue sections)
  const [scrubCatId, setScrubCatId] = useState<string | null>(null);
  const lastScrubIndexRef = useRef<number>(-1);
  // aisles captured when a drag starts (ids + where each section starts), so nothing is measured mid-drag
  const [scrubIds, setScrubIds] = useState<string[]>([]);
  const scrubTargetsRef = useRef<number[]>([]);
  const scrubIdListRef = useRef<string[]>([]);
  const scrubTrackRef = useRef<{ top: number; length: number }>({ top: 110, length: 1 });
  const scrubFractionRef = useRef<number>(0);
  // true for a moment after release, so the droplet glides back to its scroll-progress spot
  const [isGliding, setIsGliding] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragRef = useRef<{ startY: number; moved: boolean } | null>(null);

  const isMouseDevice = () => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  };

  const setRetractedState = (retracted: boolean) => {
    isRetractedRef.current = retracted;
    setIsRetracted(retracted);
  };

  // Schedule auto-retract after 1.5s of no scroll/hover activity
  const scheduleRetract = () => {
    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }
    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setRetractedState(true);
        setActiveLabelId(null);
      }
    }, 1500);
  };

  // Called on any scroll, wheel, or touchmove activity
  // Requirement: Wait 1 second of continuous scroll before making the retracted rail reappear,
  // so short navigation flicks never obstruct the user's view.
  const handleScrollActivity = (fromUserInteraction = false) => {
    // If the user physically scrolls with wheel or touch, break out of click-action lock
    if (fromUserInteraction) {
      isClickActionRef.current = false;
    }

    // During programmatic smooth scroll triggered by click, let the clicked label stay visible for 1.5s
    if (isClickActionRef.current) return;
    // Scrubbing with the handle: keep the rail rolled up
    if (isDraggingRef.current) return;

    if (isRetractedRef.current) {
      // ── BAR IS CURRENTLY RETRACTED ──────────────────────────────────────────
      // Require 1 full second (1000ms) of active scrolling before popping the bar out
      if (!wakeUpTimerRef.current) {
        wakeUpTimerRef.current = setTimeout(() => {
          setRetractedState(false);
          setActiveLabelId(null); // No text label on scroll
          wakeUpTimerRef.current = null;
          scheduleRetract();
        }, 1000);
      }

      // If the user pauses or stops scrolling for more than 250ms, cancel the 1s wake-up
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
      scrollStopTimerRef.current = setTimeout(() => {
        if (wakeUpTimerRef.current) {
          clearTimeout(wakeUpTimerRef.current);
          wakeUpTimerRef.current = null;
        }
      }, 250);
    } else {
      // ── BAR IS ALREADY AWAKE & VISIBLE ───────────────────────────────────────
      // Ensure no text label is shown during scroll
      setActiveLabelId(null);

      // Refresh the 1.5s auto-retract timer on every scroll tick
      scheduleRetract();
    }
  };

  // Initial mount: show rail for 1.5s, then automatically retract to the right.
  // Wheel / scroll / touch: listens to scroll activity with 1s threshold when retracted
  useEffect(() => {
    // Initial load: show for 1.5s then retract
    setRetractedState(false);
    setActiveLabelId(null);

    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setRetractedState(true);
        setActiveLabelId(null);
      }
    }, 1500);

    const handleWheel = () => handleScrollActivity(true);
    const handleTouchMove = () => handleScrollActivity(true);
    const handleScroll = () => handleScrollActivity(false);

    // Wake up rail immediately when cursor approaches the right edge / margin on PC
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDevice()) return;
      if (isClickActionRef.current) return;
      // cursor already on the rail: keep the hovered bubble's label (this used to wipe it on every move)
      if (isHoveredRef.current) return;

      const screenRightThreshold = window.innerWidth - 80;
      const containerRightThreshold = (window.innerWidth + Math.min(window.innerWidth, 1280)) / 2 - 30;
      const rightThreshold = Math.min(screenRightThreshold, containerRightThreshold);

      if (e.clientX >= rightThreshold) {
        if (wakeUpTimerRef.current) {
          clearTimeout(wakeUpTimerRef.current);
          wakeUpTimerRef.current = null;
        }
        setRetractedState(false);
        setActiveLabelId(null);
        scheduleRetract();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll);
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      if (wakeUpTimerRef.current) clearTimeout(wakeUpTimerRef.current);
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
    };
  }, []);

  const trackLength = () => Math.max(1, window.innerHeight - HANDLE_TRACK_TOP - HANDLE_TRACK_BOTTOM);

  // Keep the droplet at the page's scroll progress, like a scrollbar thumb.
  // Written straight to the DOM once per frame: no React re-render and no CSS transition on `top` (those made it stutter).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = handleRef.current;
      if (!el || isDraggingRef.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.top = `${HANDLE_TRACK_TOP + f * trackLength()}px`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const jumpTo = (y: number) => {
    // go through Lenis when it is running so it does not drag the page back to its own position
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); // 'instant': html has scroll-behavior: smooth
  };

  // Contacts-style index picker. While the finger moves, the PAGE DOES NOT MOVE: a glass overlay lists the
  // aisles and highlights the one under the finger. The page jumps once, on release.
  // (Jumping live made iOS Safari blank out the product images and shake the layout.)
  const startScrub = () => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[id^="cat-section-"]'));
    scrubIdListRef.current = sections.map((sec) => sec.id.replace('cat-section-', ''));
    setScrubIds(scrubIdListRef.current);
    scrubTargetsRef.current = sections.map((sec) => sec.getBoundingClientRect().top + window.scrollY - 110);
    scrubTrackRef.current = { top: HANDLE_TRACK_TOP, length: trackLength() }; // frozen: iOS toolbars resize the viewport
    lastScrubIndexRef.current = -1;
  };

  const scrubTo = (clientY: number) => {
    const { top, length } = scrubTrackRef.current;
    const y = Math.min(top + length, Math.max(top, clientY));
    const el = handleRef.current;
    if (el) el.style.top = `${y}px`;
    const f = (y - top) / length;
    scrubFractionRef.current = f;
    const n = scrubTargetsRef.current.length;
    if (n === 0) return;
    const i = Math.min(n - 1, Math.floor(f * n));
    if (i === lastScrubIndexRef.current) return;
    lastScrubIndexRef.current = i;
    setScrubCatId(scrubIdListRef.current[i] ?? null);
    try {
      if ('vibrate' in navigator) navigator.vibrate(8); // light tick per aisle (Android)
    } catch {
      // ignore
    }
  };

  const finishScrub = () => {
    const n = scrubTargetsRef.current.length;
    if (n > 0 && lastScrubIndexRef.current >= 0) {
      jumpTo(scrubTargetsRef.current[lastScrubIndexRef.current]);
    } else if (n === 0) {
      // filtered list / search results: proportional jump
      jumpTo(scrubFractionRef.current * (document.documentElement.scrollHeight - window.innerHeight));
    }
  };

  const allCategoriesList = [
    {
      id: 'all',
      name: 'Tout voir',
      icon: '✨',
      count: totalProductsCount,
    },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '📦',
      count: productCounts[c.id] || 0,
    })),
  ];

  // When user clicks a filter: show ONLY that single label, then at 1.5s hide label AND totally retract rail
  const handleItemClick = (catId: string) => {
    // Cancel any pending scroll wake-up or stop timers
    if (wakeUpTimerRef.current) {
      clearTimeout(wakeUpTimerRef.current);
      wakeUpTimerRef.current = null;
    }
    if (scrollStopTimerRef.current) {
      clearTimeout(scrollStopTimerRef.current);
      scrollStopTimerRef.current = null;
    }

    isClickActionRef.current = true;
    isHoveredRef.current = false;
    setRetractedState(false);

    // Strictly show ONLY the clicked label (replaces any previous one)
    setActiveLabelId(catId);
    onSelectCategory(catId);

    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }

    // Exactly 1.5s after click: unconditionally collapse label AND hide rail on all devices
    retractTimerRef.current = setTimeout(() => {
      setActiveLabelId(null);
      setRetractedState(true);
      isClickActionRef.current = false;
      isHoveredRef.current = false;
    }, 1500);
  };

  const activeItem = allCategoriesList.find((c) => c.id === activeCategory) || allCategoriesList[0];

  const openFromHandle = () => {
    if (wakeUpTimerRef.current) {
      clearTimeout(wakeUpTimerRef.current);
      wakeUpTimerRef.current = null;
    }
    setRetractedState(false);
    setActiveLabelId(null);
    if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
    // leave it open a bit longer when the user asked for it explicitly
    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setRetractedState(true);
        setActiveLabelId(null);
      }
    }, 3500);
  };

  const scrubItem = (scrubCatId && allCategoriesList.find((c) => c.id === scrubCatId)) || activeItem;

  const endDrag = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (!d.moved) {
      openFromHandle(); // a simple tap still unrolls the rail
      return;
    }
    finishScrub();
    setIsDragging(false);
    setScrubCatId(null);
    lastScrubIndexRef.current = -1;
    // glide the droplet from the finger back to the scroll-progress position
    setIsGliding(true);
    setTimeout(() => setIsGliding(false), 450);
    // let the last scroll events pass before the rail may react to scrolling again
    setTimeout(() => {
      isDraggingRef.current = false;
      window.dispatchEvent(new Event('scroll'));
    }, 200);
  };

  return (
    <>
    {/* Retracted state: a small liquid-glass droplet on the right edge with the current aisle.
        Tap = unroll the rail. Press and drag up/down = fast-scroll through the whole catalogue */}
    <button
      ref={handleRef}
      onClick={(e) => {
        if (e.detail === 0) openFromHandle(); // keyboard activation only; taps are handled on pointer up
      }}
      onPointerDown={(e) => {
        dragRef.current = { startY: e.clientY, moved: false };
        try {
          e.currentTarget.setPointerCapture(e.pointerId); // keep receiving moves even when the finger leaves the droplet
        } catch {
          // ignore
        }
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.abs(e.clientY - d.startY) > 6) {
          d.moved = true;
          isDraggingRef.current = true;
          setIsDragging(true);
          startScrub();
          if (wakeUpTimerRef.current) {
            clearTimeout(wakeUpTimerRef.current);
            wakeUpTimerRef.current = null;
          }
        }
        if (d.moved) scrubTo(e.clientY);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-label={`Ouvrir les rayons (rayon actuel : ${activeItem.name}). Glisser pour défiler`}
      onMouseEnter={() => {
        if (isMouseDevice() && !dragRef.current) openFromHandle();
      }}
      className="fixed z-40 flex items-center gap-1 rounded-l-full py-1.5 pl-1.5 pr-2 cursor-pointer select-none"
      style={{
        top: 'calc(50% + 40px)', // replaced by the scroll-progress position as soon as it mounts
        right: 0,
        touchAction: 'none',
        transform: isRetracted
          ? `translate3d(0, -50%, 0) scale(${isDragging ? 1.15 : 1})`
          : 'translate3d(110%, -50%, 0) scale(0.6)',
        opacity: isRetracted ? 1 : 0,
        pointerEvents: isRetracted ? 'auto' : 'none',
        transition: isDragging
          ? 'transform 200ms cubic-bezier(0.34, 1.6, 0.5, 1)'
          : isRetracted
            ? `transform 600ms cubic-bezier(0.34, 1.6, 0.5, 1) 420ms, opacity 250ms ease-out 420ms${isGliding ? ', top 300ms ease-out' : ''}`
            : 'transform 220ms ease-in, opacity 160ms ease-in',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRight: 'none',
        boxShadow:
          '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 0 18px rgba(255, 46, 99, 0.18)',
      }}
    >
      <span className="h-6 w-1 rounded-full bg-white/35" />
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
        style={{
          background:
            'radial-gradient(120% 120% at 30% 20%, rgba(255, 80, 140, 0.42) 0%, rgba(255, 46, 99, 0.20) 65%, rgba(255, 255, 255, 0.12) 100%)',
          border: '1px solid rgba(255, 140, 180, 0.50)',
          boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.6)',
        }}
      >
        {isDragging ? scrubItem.icon : activeItem.icon}
      </span>

    </button>

    {/* Scrub picker: dark veil (no backdrop blur: too heavy over the catalogue on iOS) + the aisles,
        the one under the finger blown up in pink liquid glass */}
    <div
      aria-hidden
      className="fixed inset-0 z-[39] flex items-center pointer-events-none"
      style={{
        background: 'radial-gradient(120% 80% at 85% 50%, rgba(40, 8, 22, 0.92) 0%, rgba(8, 8, 10, 0.9) 70%)',
        opacity: isDragging ? 1 : 0,
        transition: isDragging ? 'opacity 160ms ease-out' : 'opacity 260ms ease-in 60ms',
      }}
    >
      <ul className="ml-5 mr-24 flex w-full flex-col gap-1.5">
        {scrubIds.map((id, i) => {
          const item = allCategoriesList.find((c) => c.id === id);
          if (!item) return null;
          const on = id === scrubCatId;
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-full px-4 py-2 whitespace-nowrap"
              style={{
                transform: `translate3d(${on ? 0 : -6}px, 0, 0) scale(${on ? 1.05 : 1})`,
                transformOrigin: 'left center',
                opacity: isDragging ? (on ? 1 : 0.45) : 0,
                transition: `transform 260ms cubic-bezier(0.34, 1.6, 0.5, 1), opacity 200ms ease-out ${isDragging ? i * 18 : 0}ms, background 200ms`,
                ...(on
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(255, 75, 130, 0.45) 0%, rgba(30, 14, 22, 0.95) 60%, rgba(255, 75, 130, 0.28) 100%)',
                      border: '1px solid rgba(255, 150, 190, 0.55)',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 6px 24px rgba(255, 46, 99, 0.35)',
                    }
                  : { border: '1px solid transparent' }),
              }}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className={`truncate font-bold ${on ? 'text-lg text-white' : 'text-base text-white/80'}`}>{item.name}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-xs font-bold ${on ? 'bg-white/20 text-white' : 'text-white/40'}`}>
                {item.count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>

    <nav
      aria-label="Navigation rapide par rayon"
      onMouseEnter={() => {
        // Only trigger hover on real mouse devices (never touch taps)
        if (isMouseDevice()) {
          isHoveredRef.current = true;
          setRetractedState(false);
          if (wakeUpTimerRef.current) {
            clearTimeout(wakeUpTimerRef.current);
            wakeUpTimerRef.current = null;
          }
          if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        }
      }}
      onMouseLeave={() => {
        setHoverIndex(null);
        if (isMouseDevice()) {
          isHoveredRef.current = false;
          setActiveLabelId(null);
          scheduleRetract();
        }
      }}
      onFocus={() => {
        // keyboard users: tabbing into the rail keeps it unrolled
        isHoveredRef.current = true;
        setRetractedState(false);
        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          isHoveredRef.current = false;
          scheduleRetract();
        }
      }}
      className="fixed z-40 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2.5 p-1 md:p-1.5 lg:p-2 rounded-full overflow-visible"
      style={{
        top: 'calc(50% + 40px)',
        right: 'max(10px, calc((100vw - 80rem) / 2 - 3.5rem))',
        // Liquid unroll: the glass tube stretches open vertically with a soft overshoot,
        // and rolls back up into a droplet that slips off to the right edge.
        transform: isRetracted
          ? 'translate3d(46px, -50%, 0) scale(0.55, 0.08)'
          : 'translate3d(0, -50%, 0) scale(1, 1)',
        transformOrigin: '50% 50%',
        opacity: isRetracted ? 0 : 1,
        pointerEvents: isRetracted ? 'none' : 'auto',
        willChange: 'transform, opacity',
        transition: isRetracted
          ? 'transform 560ms cubic-bezier(0.55, 0, 0.75, 0.25) 120ms, opacity 260ms ease-in 380ms'
          : 'transform 720ms cubic-bezier(0.34, 1.45, 0.5, 1), opacity 180ms ease-out',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow:
          '0 12px 36px 0 rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 46, 99, 0.10)',
      }}
    >
      {allCategoriesList.map((cat, index) => {
        const isActive = activeCategory === cat.id;
        const n = allCategoriesList.length;
        // Strictly guarantees that max 1 single label can ever be visible at once
        const isLabelVisible = activeLabelId === cat.id;
        // dock magnification: hovered bubble 1.28x, neighbours 1.14x / 1.05x, liquid spring
        const dist = hoverIndex === null ? null : Math.abs(hoverIndex - index);
        const magnify = dist === null ? 0 : [0.28, 0.14, 0.05][dist] ?? 0;
        const bubbleScale = (isActive ? 1.1 : 1) + magnify;

        return (
          <div
            key={cat.id}
            className="relative flex items-center justify-center"
            style={{
              transform: isRetracted ? 'translate3d(14px, 0, 0) scale(0.4)' : 'translate3d(0, 0, 0) scale(1)',
              opacity: isRetracted ? 0 : 1,
              filter: isRetracted ? 'blur(3px)' : 'blur(0px)',
              transition: isRetracted
                ? `transform 260ms cubic-bezier(0.55, 0, 0.75, 0.25) ${(n - 1 - index) * 22}ms, opacity 200ms ease-in ${(n - 1 - index) * 22}ms, filter 200ms ease-in ${(n - 1 - index) * 22}ms`
                : `transform 520ms cubic-bezier(0.34, 1.7, 0.5, 1) ${90 + index * 38}ms, opacity 260ms ease-out ${90 + index * 38}ms, filter 300ms ease-out ${90 + index * 38}ms`,
            }}
            onMouseEnter={() => {
              if (isMouseDevice()) {
                setActiveLabelId(cat.id);
                setHoverIndex(index);
              }
            }}
            onMouseLeave={() => {
              if (isMouseDevice()) {
                setActiveLabelId((current) => (current === cat.id ? null : current));
              }
            }}
          >
            {/* Expanded text pill popping out to the left with smooth fluid entry/exit */}
            <button
              onClick={() => handleItemClick(cat.id)}
              className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 md:mr-4 flex items-center gap-2 md:gap-3 whitespace-nowrap rounded-full px-3.5 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm shadow-2xl z-50 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isLabelVisible
                  ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                  : 'opacity-0 translate-x-3 scale-95 pointer-events-none'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 75, 130, 0.40) 0%, rgba(18, 18, 24, 0.90) 60%, rgba(255, 75, 130, 0.25) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 150, 190, 0.50)',
                boxShadow:
                  '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 0 25px rgba(255, 46, 99, 0.35)',
              }}
            >
              <span className="font-bold tracking-tight text-white md:text-sm">{cat.name}</span>
              <span
                className="font-mono text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full font-bold"
                style={{
                  background: 'rgba(255, 255, 255, 0.16)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                }}
              >
                {cat.count}
              </span>
            </button>

            {/* Compact Apple Liquid Glass emoji circle button */}
            <button
              onClick={() => handleItemClick(cat.id)}
              aria-label={`Rayon ${cat.name}`}
              className="relative flex h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full text-base md:text-lg lg:text-xl active:!scale-90 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              style={{
                transform: `scale(${bubbleScale})`,
                transition: 'transform 320ms cubic-bezier(0.34, 1.6, 0.5, 1), background 300ms, box-shadow 300ms, border-color 300ms',
                ...(isActive
                  ? {
                      background:
                        'radial-gradient(120% 120% at 30% 20%, rgba(255, 80, 140, 0.42) 0%, rgba(255, 46, 99, 0.20) 65%, rgba(255, 255, 255, 0.12) 100%)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 140, 180, 0.50)',
                      boxShadow:
                        'inset 0 1.5px 2px rgba(255, 255, 255, 0.60), inset 0 -1px 2px rgba(255, 46, 99, 0.3), 0 4px 18px rgba(255, 46, 99, 0.32)',
                    }
                  : {
                      background: dist === 0 ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.04)',
                      border: dist === 0 ? '1px solid rgba(255, 150, 190, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: dist === 0
                        ? 'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 4px 14px rgba(255, 46, 99, 0.22)'
                        : 'inset 0 1px 0.5px rgba(255, 255, 255, 0.15)',
                    }),
              }}
            >
              <span
                className={
                  isActive
                    ? 'scale-105 drop-shadow-[0_2px_6px_rgba(255,46,99,0.5)]'
                    : 'drop-shadow-sm'
                }
              >
                {cat.icon}
              </span>

              {/* Glossy top specular reflection highlight for active bubble */}
              {isActive && (
                <span
                  className="absolute top-1 left-2 h-1 w-2 rounded-full pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), transparent)',
                  }}
                />
              )}
            </button>
          </div>
        );
      })}
    </nav>
    </>
  );
}
