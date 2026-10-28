'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="site-footer border-t border-white/5 bg-surface-muted">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl tracking-wider text-white">
              ELEVEN<span className="text-primary">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Votre épicerie de nuit à Roanne.
              <br />
              Ouvert 24h/24, 7j/7.
              <br />
              Livraison à domicile.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
              Navigation
            </h4>
            <nav className="flex flex-col gap-2" aria-label="Pied de page">
              <Link href="/" className="text-sm text-white/60 transition-colors hover:text-white">
                Accueil
              </Link>
              <Link href="/catalogue" className="text-sm text-white/60 transition-colors hover:text-white">
                Catalogue
              </Link>
              <Link href="/panier" className="text-sm text-white/60 transition-colors hover:text-white">
                Panier
              </Link>
            </nav>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
              Informations
            </h4>
            <nav className="flex flex-col gap-2" aria-label="Informations légales">
              <Link href="/mentions-legales" className="text-sm text-white/60 transition-colors hover:text-white">
                Mentions légales
              </Link>
              <Link href="/cgv" className="text-sm text-white/60 transition-colors hover:text-white">
                CGV
              </Link>
              <Link href="/confidentialite" className="text-sm text-white/60 transition-colors hover:text-white">
                Confidentialité
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-white/30">
            © {year} Eleven Shop — Roanne (42300). Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
