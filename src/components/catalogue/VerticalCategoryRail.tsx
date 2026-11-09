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
  const [expandedId, setExpandedId] = useState<string | null>(activeCategory);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isRetracted, setIsRetracted] = useState<boolean>(false);

  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef<boolean>(false);

  // Wakes up the rail (slides it out) and schedules retract after 1.5s of inactivity
  const wakeUpRail = () => {
    setIsRetracted(false);

    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }

    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsRetracted(true);
        setExpandedId(null);
      }
    }, 1500);
  };

  // Initial mount: show rail for 1.5s, then automatically retract to the right.
  // Window scroll: instantly wakes up the rail and refreshes the 1.5s timer.
  useEffect(() => {
    setIsRetracted(false);

    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsRetracted(true);
        setExpandedId(null);
      }
    }, 1500);

    const handleScroll = () => {
      wakeUpRail();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
    };
  }, []);

  // When activeCategory changes (from page scroll), wake up rail & briefly expand label
  useEffect(() => {
    setIsRetracted(false);
    setExpandedId(activeCategory);

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }

    // Auto-collapse to emoji-only after 2s to keep screen 100% clear
    collapseTimerRef.current = setTimeout(() => {
      setExpandedId(null);
    }, 2000);

    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [activeCategory]);

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

  const handleItemClick = (catId: string) => {
    setIsRetracted(false);
    setExpandedId(catId);
    onSelectCategory(catId);

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(() => {
      setExpandedId(null);
    }, 2500);

    // Keep rail awake during category click and transition
    if (retractTimerRef.current) {
      clearTimeout(retractTimerRef.current);
    }
    retractTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsRetracted(true);
        setExpandedId(null);
      }
    }, 2500);
  };

  return (
    <nav
      aria-label="Navigation rapide par rayon"
      onMouseEnter={() => {
        isHoveredRef.current = true;
        setIsRetracted(false);
        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        setHoveredId(null);
        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        retractTimerRef.current = setTimeout(() => {
          setIsRetracted(true);
          setExpandedId(null);
        }, 1500);
      }}
      onClick={() => {
        if (isRetracted) wakeUpRail();
      }}
      className="fixed right-[10px] sm:right-3 md:right-4 lg:right-[max(1rem,calc((100vw-80rem)/2+1.5rem))] z-40 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2.5 p-1 md:p-1.5 lg:p-2 rounded-full overflow-visible pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
      style={{
        top: 'calc(50% + 40px)',
        transform: isRetracted
          ? 'translateY(-50%) translateX(calc(100% - 12px))'
          : 'translateY(-50%) translateX(0)',
        opacity: isRetracted ? 0.7 : 1,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: isRetracted
          ? '1px solid rgba(255, 150, 190, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: isRetracted
          ? '0 0 16px rgba(255, 46, 99, 0.30), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
          : '0 12px 36px 0 rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 46, 99, 0.10)',
      }}
    >
      {allCategoriesList.map((cat) => {
        const isActive = activeCategory === cat.id;
        const isExpanded = expandedId === cat.id || hoveredId === cat.id;

        return (
          <div
            key={cat.id}
            className="relative flex items-center justify-center"
            onMouseEnter={() => setHoveredId(cat.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Expanded text pill popping out to the left (Apple Liquid Glass) */}
            {isExpanded && (
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
                    'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 46, 99, 0.25)',
                }}
              >
                <span className="text-sm md:text-lg">{cat.icon}</span>
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
