/**
 * ══════════════════════════════════════════════
 *  ELEVEN SHOP — Hero slides data (video-inspired)
 * ══════════════════════════════════════════════
 *  Star products with vibrant 3D presentation,
 *  transparent cutouts, tone-on-tone typography
 *  and floating elements.
 * ══════════════════════════════════════════════
 */

export interface FloatingItem {
  src: string;
  alt: string;
  depth: number;       // 0 = small/distant, 1 = close/foreground
  initialX: string;    // CSS %
  initialY: string;
  size: number;        // size in px (e.g. 50-120)
  rotation?: number;   // initial rotation deg
}

export interface HeroSlide {
  id: string;
  productName: string;
  tagline: string;
  description: string;
  categoryTag: string;
  bgColor: string;         // vibrant background color
  bgGlow: string;          // central radial highlight
  wordColor: string;       // tone-on-tone for the big 3D background word
  bigWord: string;         // e.g. "STRAWBERRY", "WINGS", "CREAMY"
  accentColor: string;     // CTA & badge color
  image: string;           // transparent PNG cutout
  floatingElements: FloatingItem[];
  priceCents: number;
  slug: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'prod-monster-strawberry',
    productName: 'Monster Ultra Strawberry Dreams',
    tagline: 'Fraise givrée • Zéro sucre',
    description: 'Édition rare importée aux arômes naturels de fraise givrée. Énergie maximale 24h/24.',
    categoryTag: '0% SUCRE • ÉDITION RARE',
    bgColor: '#D92A6B',
    bgGlow: '#FF5E98',
    wordColor: '#B0184F',
    bigWord: 'STRAWBERRY',
    accentColor: '#FF2A75',
    image: '/products/hero-monster-strawberry.png',
    floatingElements: [
      { src: '/hero/strawberry-whole.png', alt: 'Fraise', depth: 0.9, initialX: '14%', initialY: '24%', size: 90, rotation: -18 },
      { src: '/hero/strawberry-slice.png', alt: 'Tranche de fraise', depth: 0.7, initialX: '82%', initialY: '30%', size: 100, rotation: 25 },
      { src: '/hero/ice-cube-1.svg', alt: 'Glaçon', depth: 0.4, initialX: '22%', initialY: '68%', size: 55, rotation: 40 },
      { src: '/hero/ice-cube-2.svg', alt: 'Glaçon', depth: 0.8, initialX: '78%', initialY: '66%', size: 75, rotation: -30 },
      { src: '/hero/drop-1.svg', alt: 'Goutte', depth: 0.5, initialX: '28%', initialY: '18%', size: 36, rotation: 12 },
      { src: '/hero/drop-2.svg', alt: 'Goutte', depth: 0.6, initialX: '72%', initialY: '15%', size: 40, rotation: -15 },
    ],
    priceCents: 280,
    slug: 'monster-ultra-strawberry-dreams',
  },
  {
    id: 'prod-redbull-ruby',
    productName: 'Red Bull Ruby Edition 250ml',
    tagline: 'Fruits rouges & Baies d’açai',
    description: 'Édition spéciale aux fruits rouges rafraîchissants et baies rares. Vitalise corps et esprit.',
    categoryTag: 'ÉNERGIE MAX • ÉDITION LIMITÉE',
    bgColor: '#9E0E36',
    bgGlow: '#D82357',
    wordColor: '#700723',
    bigWord: 'WINGS',
    accentColor: '#FF1E56',
    image: '/products/hero-redbull-ruby.png',
    floatingElements: [
      { src: '/hero/strawberry-slice.png', alt: 'Fruits rouges', depth: 0.8, initialX: '18%', initialY: '26%', size: 85, rotation: -22 },
      { src: '/hero/ice-cube-1.svg', alt: 'Glaçon', depth: 0.7, initialX: '84%', initialY: '32%', size: 70, rotation: 35 },
      { src: '/hero/ice-cube-2.svg', alt: 'Glaçon', depth: 0.4, initialX: '16%', initialY: '62%', size: 55, rotation: -45 },
      { src: '/hero/drop-1.svg', alt: 'Goutte', depth: 0.5, initialX: '76%', initialY: '70%', size: 42, rotation: 18 },
      { src: '/hero/drop-2.svg', alt: 'Goutte', depth: 0.9, initialX: '24%', initialY: '16%', size: 45, rotation: -20 },
      { src: '/hero/bubble-1.svg', alt: 'Bulle', depth: 0.3, initialX: '80%', initialY: '18%', size: 38, rotation: 0 },
    ],
    priceCents: 300,
    slug: 'red-bull-ruby-edition',
  },
  {
    id: 'prod-drpepper-coconut',
    productName: 'Dr Pepper Creamy Coconut',
    tagline: '23 Saveurs • Crème de Coco',
    description: 'Le goût légendaire des 23 saveurs fusionné avec une douce touche de crème de coco exotique.',
    categoryTag: 'IMPORT EXCLUSIF USA',
    bgColor: '#6B1426',
    bgGlow: '#9E223D',
    wordColor: '#450916',
    bigWord: 'CREAMY',
    accentColor: '#E2553A',
    image: '/products/hero-drpepper-coconut.png',
    floatingElements: [
      { src: '/hero/ice-cube-1.svg', alt: 'Glaçon', depth: 0.8, initialX: '15%', initialY: '30%', size: 80, rotation: 20 },
      { src: '/hero/ice-cube-2.svg', alt: 'Glaçon', depth: 0.6, initialX: '82%', initialY: '28%', size: 65, rotation: -25 },
      { src: '/hero/drop-1.svg', alt: 'Goutte', depth: 0.4, initialX: '20%', initialY: '72%', size: 40, rotation: -10 },
      { src: '/hero/drop-2.svg', alt: 'Goutte', depth: 0.9, initialX: '85%', initialY: '68%', size: 48, rotation: 25 },
      { src: '/hero/bubble-2.svg', alt: 'Bulle', depth: 0.5, initialX: '75%', initialY: '16%', size: 36, rotation: 0 },
      { src: '/hero/bubble-1.svg', alt: 'Bulle', depth: 0.3, initialX: '26%', initialY: '18%', size: 32, rotation: 0 },
    ],
    priceCents: 250,
    slug: 'dr-pepper-creamy-coconut',
  },
];
