'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useScrolled } from '@/hooks/use-utils';
import { useCart } from '@/stores/cart';
import { Menu, X, ShoppingBag, Shield } from 'lucide-react';

export default function Header() {
  const scrolled = useScrolled(80);
  const { totalItems, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Catalogue', href: '/catalogue' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <header
      className={`site-header fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex items-center justify-between px-5 py-3 max-w-7xl md:px-8">
        {/* ── Logo ──────────────────────────── */}
        <Link
          href="/"
          className="font-display text-2xl tracking-wider text-white md:text-3xl"
        >
          ELEVEN<span className="text-primary">.</span>
        </Link>

        {/* ── Desktop nav ───────────────────── */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}

          {/* Admin Connection Button */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            title="Connexion Panel Admin"
          >
            <Shield size={14} className="text-primary" />
            <span>Admin</span>
          </Link>

          {/* Desktop Cart Button */}
          <button
            onClick={openDrawer}
            className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
            aria-label="Ouvrir le panier"
          >
            <ShoppingBag size={18} className="text-primary" />
            <span>Panier</span>
            {mounted && totalItems > 0 && (
              <span className="badge">
                {totalItems}
              </span>
            )}
          </button>

          <Link href="/catalogue" className="btn-pill btn-pill-outline text-sm">
            Commander
          </Link>
        </nav>

        {/* ── Mobile controls ───────────────── */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Cart button */}
          <button
            onClick={openDrawer}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label="Ouvrir le panier"
          >
            <ShoppingBag size={20} className="text-white" />
            {mounted && totalItems > 0 && (
              <span className="badge absolute -right-1 -top-1">
                {totalItems}
              </span>
            )}
          </button>

          {/* Menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={20} className="text-white" />
            ) : (
              <Menu size={20} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu bubble ──────────────── */}
      <div
        className={`absolute right-4 top-full mt-2 w-56 rounded-2xl p-4 transition-all duration-300 md:hidden ${
          menuOpen
            ? 'visible scale-100 opacity-100'
            : 'invisible scale-95 opacity-0'
        }`}
        style={{
          background: 'rgba(20, 20, 20, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <nav className="flex flex-col gap-1" aria-label="Menu mobile">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              openDrawer();
            }}
            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white text-left"
          >
            <span>Mon Panier</span>
            {mounted && totalItems > 0 && <span className="badge">{totalItems}</span>}
          </button>
          <div className="my-2 h-px bg-white/10" />
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Shield size={16} />
            <span>Espace Admin</span>
          </Link>
          <Link
            href="/catalogue"
            onClick={() => setMenuOpen(false)}
            className="btn-pill btn-pill-primary w-full text-center text-sm mt-1"
          >
            Commander
          </Link>
        </nav>
      </div>
    </header>
  );
}
