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
    id: 'energy-monster-strawberry',
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
    priceCents: 300,
    slug: 'monster-ultra-strawberry-dreams',
  },
  {
    id: 'energy-redbull-ruby-pear',
    productName: 'Red Bull Ruby Spiced Pear 250ml',
    tagline: 'Poire Dorée • Cannelle & Épices',
    description: 'Édition limitée Ruby — alliance unique de poire juteuse, cannelle, anis étoilé et piment. Vitalise corps et esprit.',
    categoryTag: 'ÉNERGIE MAX • ÉDITION LIMITÉE',
    bgColor: '#8B1818',
    bgGlow: '#D44A1A',
    wordColor: '#630E0E',
    bigWord: 'SPICED',
    accentColor: '#E03A1E',
    image: '/products/hero-redbull-ruby-pear.png',
    floatingElements: [
      { src: '/hero/chili-whole.png', alt: 'Piment rouge', depth: 0.9, initialX: '21%', initialY: '38%', size: 105, rotation: -16 },
      { src: '/hero/chili-slice.png', alt: 'Piment coupé en deux', depth: 0.75, initialX: '79%', initialY: '36%', size: 105, rotation: 20 },
      { src: '/hero/ice-cube-1.svg', alt: 'Glaçon', depth: 0.4, initialX: '20%', initialY: '68%', size: 55, rotation: 35 },
      { src: '/hero/ice-cube-2.svg', alt: 'Glaçon', depth: 0.8, initialX: '80%', initialY: '68%', size: 70, rotation: -28 },
      { src: '/hero/drop-1.svg', alt: 'Goutte', depth: 0.5, initialX: '27%', initialY: '18%', size: 38, rotation: 14 },
      { src: '/hero/drop-2.svg', alt: 'Goutte', depth: 0.6, initialX: '74%', initialY: '16%', size: 42, rotation: -16 },
    ],
    priceCents: 350,
    slug: 'red-bull-ruby-edition-poire-epicee',
  },
  {
    id: 'soda-drpepper-coconut',
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
      { src: '/hero/coconut-half.png', alt: 'Demi noix de coco', depth: 0.85, initialX: '19%', initialY: '36%', size: 120, rotation: -12 },
      { src: '/hero/coconut-chunk.png', alt: 'Quartier de noix de coco', depth: 0.8, initialX: '81%', initialY: '34%', size: 120, rotation: 15 },
      { src: '/hero/ice-cube-1.svg', alt: 'Glaçon', depth: 0.4, initialX: '22%', initialY: '68%', size: 55, rotation: 30 },
      { src: '/hero/ice-cube-2.svg', alt: 'Glaçon', depth: 0.7, initialX: '80%', initialY: '66%', size: 70, rotation: -25 },
      { src: '/hero/drop-1.svg', alt: 'Goutte', depth: 0.5, initialX: '26%', initialY: '18%', size: 38, rotation: 12 },
      { src: '/hero/drop-2.svg', alt: 'Goutte', depth: 0.6, initialX: '74%', initialY: '16%', size: 42, rotation: -15 },
    ],
    priceCents: 280,
    slug: 'dr-pepper-creamy-coconut',
  },
];
