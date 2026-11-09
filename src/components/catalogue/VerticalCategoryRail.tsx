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
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When activeCategory changes (e.g. from page scroll), briefly expand the label to announce it
  useEffect(() => {
    setExpandedId(activeCategory);

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }

    // Auto-collapse to emoji-only after 2.5s on mobile to keep screen 100% clear
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
    <>
      {/* ── DESKTOP SIDEBAR (md:) ───────────────────────── */}
      <aside className="hidden md:block w-64 flex-shrink-0 sticky top-28 self-start">
        <div className="rounded-3xl border border-white/10 bg-surface-elevated/70 backdrop-blur-md p-3.5 space-y-1.5 shadow-xl">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between">
            <span>Rayons & Filtres</span>
            <span className="font-mono text-primary text-[10px]">{allCategoriesList.length}</span>
          </div>

          <div className="space-y-1">
            {allCategoriesList.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleItemClick(cat.id)}
                  className={`w-full flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-primary text-black font-bold shadow-glow scale-[1.02]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base flex-shrink-0">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono flex-shrink-0 ${
                      isActive ? 'text-black/70 font-bold' : 'text-white/40'
                    }`}
                  >
                    ({cat.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── MOBILE FLOATING RAIL (< md:) ──────────────────── */}
      {/* Docked on the right edge, vertically centered, showing all emojis */}
      <nav
        aria-label="Navigation rapide par rayon"
        className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-1.5 p-1 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)] md:hidden"
      >
        {allCategoriesList.map((cat) => {
          const isActive = activeCategory === cat.id;
          const isExpanded = expandedId === cat.id;

          return (
            <div key={cat.id} className="relative flex items-center justify-end">
              {/* Expanded text pill popping out to the left */}
              {isExpanded && (
                <button
                  onClick={() => handleItemClick(cat.id)}
                  className="absolute right-full mr-2 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary text-black font-bold px-3 py-1.5 text-xs shadow-glow animate-in fade-in slide-in-from-right-3 duration-200 z-40"
                >
                  <span>{cat.icon}</span>
                  <span className="font-bold tracking-tight">{cat.name}</span>
                  <span className="font-mono text-[10px] text-black/70 font-semibold">
                    ({cat.count})
                  </span>
                </button>
              )}

              {/* Compact emoji circle button */}
              <button
                onClick={() => handleItemClick(cat.id)}
                aria-label={`Rayon ${cat.name}`}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 active:scale-90 ${
                  isActive
                    ? 'bg-primary text-black shadow-glow scale-110'
                    : 'bg-white/5 text-white/80 hover:bg-white/15 border border-white/10'
                }`}
              >
                <span>{cat.icon}</span>

                {/* Subtle active pulse dot */}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-black animate-pulse" />
                )}
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );
}
