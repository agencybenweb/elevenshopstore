/**
 * ══════════════════════════════════════════════
 *  ELEVEN SHOP — Design Tokens
 * ══════════════════════════════════════════════
 *  Every visual constant lives here.
 *  When the brand charter arrives, update this
 *  file alone and the whole site follows.
 * ══════════════════════════════════════════════
 */

export const tokens = {
  /* ── Couleurs ─────────────────────────────── */
  colors: {
    /* surface */
    background: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',
    surfaceMuted: '#111111',

    /* accent */
    primary: '#FF2A85',        // Rose néon signature Eleven Shop — CTA, liens, badges
    primaryMuted: '#E01E72',
    primaryLight: '#FF5C9D',
    secondary: '#FF6B35',      // orange chaud — alertes

    /* texte */
    text: '#FAFAFA',
    textMuted: '#A0A0A0',
    textInverse: '#0A0A0A',

    /* bordures & séparateurs */
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',

    /* statuts */
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',

    /* glassmorphism */
    glass: 'rgba(20,20,20,0.65)',
    glassBorder: 'rgba(255,255,255,0.1)',
  },

  /* ── Typographie ──────────────────────────── */
  fonts: {
    display: "'Bebas Neue', 'Impact', sans-serif",  // titres massifs
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  fontSizes: {
    xs: '0.75rem',    // 12
    sm: '0.875rem',   // 14
    base: '1rem',     // 16
    lg: '1.125rem',   // 18
    xl: '1.25rem',    // 20
    '2xl': '1.5rem',  // 24
    '3xl': '2rem',    // 32
    '4xl': '2.75rem', // 44
    '5xl': '3.5rem',  // 56
    hero: 'clamp(4rem, 12vw, 10rem)',
    heroWord: 'clamp(6rem, 22vw, 18rem)',
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  /* ── Espacements ──────────────────────────── */
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    section: 'clamp(4rem, 10vw, 8rem)',
  },

  /* ── Formes ───────────────────────────────── */
  radii: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    pill: '9999px',
    round: '50%',
  },

  /* ── Ombres ───────────────────────────────── */
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.25)',
    md: '0 4px 20px rgba(0,0,0,0.35)',
    lg: '0 8px 40px rgba(0,0,0,0.45)',
    glow: '0 0 35px rgba(255,42,133,0.35)',
    card: '0 8px 32px rgba(0,0,0,0.3)',
    float: '0 16px 48px rgba(0,0,0,0.4)',
  },

  /* ── Transitions ──────────────────────────── */
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    hero: '900ms cubic-bezier(0.76, 0, 0.24, 1)',
  },

  /* ── Breakpoints ──────────────────────────── */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /* ── Z-index ──────────────────────────────── */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    header: 30,
    overlay: 40,
    modal: 50,
    toast: 60,
  },
} as const;

export type Tokens = typeof tokens;
