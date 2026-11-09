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

  const retractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const isClickActionRef = useRef<boolean>(false);

  const isMouseDevice = () => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  };

  // Wakes up the rail (slides it out) on scroll WITHOUT any label, and retracts after 1.5s
  const wakeUpRail = (fromUserInteraction = false) => {
    // If the user physically scrolls with wheel or touch, break out of click-action lock
    if (fromUserInteraction) {
      isClickActionRef.current = false;
    }

    // During programmatic smooth scroll triggered by click, let the clicked label stay visible for 1.5s
    if (isClickActionRef.current) return;

    // Rail slides into view
    setIsRetracted(false);

    // Requirement: scrolling brings back the rail WITHOUT any text label
    setActiveLabelId(null);

    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }

    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsRetracted(true);
        setActiveLabelId(null);
      }
    }, 1500);
  };

  // Initial mount: show rail for 1.5s, then automatically retract to the right.
  // Wheel / scroll / touch: instantly wakes up the rail on both PC & mobile on ANY scroll (up or down)
  useEffect(() => {
    // Initial load: show for 1.5s then retract
    setIsRetracted(false);
    setActiveLabelId(null);

    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsRetracted(true);
        setActiveLabelId(null);
      }
    }, 1500);

    // Mouse wheel (up or down) on PC
    const handleWheel = () => {
      wakeUpRail(true);
    };

    // Touch dragging on mobile
    const handleTouchMove = () => {
      wakeUpRail(true);
    };

    // Standard page scroll up/down
    const handleScroll = () => {
      wakeUpRail(false);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
    };
  }, []);

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
    isClickActionRef.current = true;
    isHoveredRef.current = false;
    setIsRetracted(false);

    // Strictly show ONLY the clicked label (replaces any previous one)
    setActiveLabelId(catId);
    onSelectCategory(catId);

    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }

    // Exactly 1.5s after click: unconditionally collapse label AND hide rail on all devices
    retractTimerRef.current = setTimeout(() => {
      setActiveLabelId(null);
      setIsRetracted(true);
      isClickActionRef.current = false;
      isHoveredRef.current = false;
    }, 1500);
  };

  return (
    <nav
      aria-label="Navigation rapide par rayon"
      onMouseEnter={() => {
        // Only trigger hover on real mouse devices (never touch taps)
        if (isMouseDevice()) {
          isHoveredRef.current = true;
          setIsRetracted(false);
          if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        }
      }}
      onMouseLeave={() => {
        if (isMouseDevice()) {
          isHoveredRef.current = false;
          setActiveLabelId(null);
          if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
          retractTimerRef.current = setTimeout(() => {
            setIsRetracted(true);
            setActiveLabelId(null);
          }, 1500);
        }
      }}
      className="fixed z-40 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2.5 p-1 md:p-1.5 lg:p-2 rounded-full overflow-visible transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        top: 'calc(50% + 40px)',
        right: 'max(10px, calc((100vw - 80rem) / 2 - 3.5rem))',
        transform: isRetracted
          ? 'translateY(-50%) translateX(calc(100% + 60px))'
          : 'translateY(-50%) translateX(0)',
        opacity: isRetracted ? 0 : 1,
        pointerEvents: isRetracted ? 'none' : 'auto',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow:
          '0 12px 36px 0 rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 46, 99, 0.10)',
      }}
    >
      {allCategoriesList.map((cat) => {
        const isActive = activeCategory === cat.id;
        // Strictly guarantees that max 1 single label can ever be visible at once
        const isLabelVisible = activeLabelId === cat.id;

        return (
          <div
            key={cat.id}
            className="relative flex items-center justify-center"
            onMouseEnter={() => {
              if (isMouseDevice()) {
                setActiveLabelId(cat.id);
              }
            }}
            onMouseLeave={() => {
              if (isMouseDevice()) {
                setActiveLabelId((current) => (current === cat.id ? null : current));
              }
            }}
          >
            {/* Expanded text pill popping out to the left (Apple Liquid Glass) */}
            {isLabelVisible && (
              <button
                onClick={() => handleItemClick(cat.id)}
                className="absolute right-full top-1/2 -translate-y-1/2 mr-3 md:mr-4 flex items-center gap-2 md:gap-3 whitespace-nowrap rounded-full px-3.5 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200 z-50 cursor-pointer pointer-events-auto"
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
            )}

            {/* Compact Apple Liquid Glass emoji circle button */}
            <button
              onClick={() => handleItemClick(cat.id)}
              aria-label={`Rayon ${cat.name}`}
              className={`relative flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full text-xs sm:text-sm md:text-lg lg:text-xl transition-all duration-300 active:scale-90 cursor-pointer ${
                isActive ? 'scale-110' : 'hover:scale-105'
              }`}
              style={
                isActive
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
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: 'inset 0 1px 0.5px rgba(255, 255, 255, 0.15)',
                    }
              }
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
  );
}
