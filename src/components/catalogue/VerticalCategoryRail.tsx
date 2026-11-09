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
      {/* Centered vertically in viewport between header and bottom with equal margins */}
      <aside
        className="hidden md:block w-64 flex-shrink-0 sticky self-start"
        style={{
          top: 'calc(50vh - 190px)',
        }}
      >
        <div
          className="rounded-3xl p-3.5 space-y-2 transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow:
              '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1.5px rgba(255, 255, 255, 0.28), 0 0 24px rgba(255, 46, 99, 0.08)',
          }}
        >
          {/* Header */}
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Rayons & Filtres
            </span>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
              style={{
                background: 'rgba(255, 75, 130, 0.22)',
                border: '1px solid rgba(255, 140, 180, 0.35)',
              }}
            >
              {allCategoriesList.length}
            </span>
          </div>

          {/* Categories List */}
          <div className="space-y-1 max-h-[70vh] overflow-y-auto no-scrollbar py-1">
            {allCategoriesList.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleItemClick(cat.id)}
                  className={`w-full flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300 text-left ${
                    isActive
                      ? 'scale-[1.02]'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(255, 75, 130, 0.30) 0%, rgba(255, 46, 99, 0.14) 60%, rgba(255, 255, 255, 0.08) 100%)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255, 140, 180, 0.45)',
                          boxShadow:
                            'inset 0 1px 1.5px rgba(255, 255, 255, 0.45), 0 4px 18px rgba(255, 46, 99, 0.22)',
                          color: '#ffffff',
                        }
                      : {
                          border: '1px solid transparent',
                        }
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base flex-shrink-0 drop-shadow-sm">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white font-bold border border-white/25'
                        : 'text-white/40'
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
      {/* Centered vertically in the visible viewport zone between header and bottom */}
      <nav
        aria-label="Navigation rapide par rayon"
        className="fixed right-[10px] z-30 flex flex-col items-center gap-1.5 p-1 rounded-full md:hidden"
        style={{
          top: 'calc(50dvh + 45px)',
          transform: 'translateY(-50%)',
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
          const isExpanded = expandedId === cat.id;

          return (
            <div key={cat.id} className="relative flex items-center justify-center">
              {/* Expanded text pill popping out to the left (Apple Liquid Glass) */}
              {isExpanded && (
                <button
                  onClick={() => handleItemClick(cat.id)}
                  className="absolute right-full mr-3 flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200 z-40"
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
                  <span className="text-sm">{cat.icon}</span>
                  <span className="font-bold tracking-tight text-white">{cat.name}</span>
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold"
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
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-300 active:scale-90 ${
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
    </>
  );
}
