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
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When activeCategory changes (from page scroll), briefly expand the label to announce it
  useEffect(() => {
    setExpandedId(activeCategory);

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }

    // Auto-collapse to emoji-only after 2.5s to keep screen 100% clear
    collapseTimerRef.current = setTimeout(() => {
      setExpandedId(null);
    }, 2500);

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
    setExpandedId(catId);
    onSelectCategory(catId);

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(() => {
      setExpandedId(null);
    }, 3000);
  };

  return (
    <nav
      aria-label="Navigation rapide par rayon"
      className="fixed right-[10px] sm:right-3 md:right-4 lg:right-[max(1rem,calc((100vw-80rem)/2+1.5rem))] top-[clamp(260px,32dvh,305px)] md:top-[calc(50vh+40px)] translate-y-0 md:-translate-y-1/2 z-30 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2.5 p-1 md:p-1.5 lg:p-2 rounded-full max-h-[calc(100dvh-32px)] overflow-y-auto no-scrollbar"
      style={{
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
                className="absolute right-full mr-3 md:mr-4 flex items-center gap-2 md:gap-3 whitespace-nowrap rounded-full px-3.5 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200 z-40 cursor-pointer"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255, 75, 130, 0.35) 0%, rgba(18, 18, 24, 0.82) 60%, rgba(255, 75, 130, 0.20) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 150, 190, 0.45)',
                  boxShadow:
                    'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 46, 99, 0.20)',
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
