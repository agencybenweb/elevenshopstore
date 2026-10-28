/**
 * ══════════════════════════════════════════════
 *  ELEVEN SHOP — Site configuration
 * ══════════════════════════════════════════════
 */

export const siteConfig = {
  name: 'Eleven Shop',
  tagline: 'Votre épicerie de nuit à Roanne',
  description:
    'Épicerie ouverte 24h/24 à Roanne (42300). Livraison à domicile de boissons, snacks et produits du quotidien.',
  url: 'https://elevenshop.fr',
  locale: 'fr-FR',

  contact: {
    phone: '07 59 84 30 41',
    email: 'contact@elevenshop.fr',
    address: '21 rue Anatole France, 42300 Roanne',
  },

  /* Paramètres par défaut — modifiables via l'admin */
  defaults: {
    minOrderCents: 1500,       // 15 €
    deliveryFeeCents: 300,     // 3 €
    freeDeliveryAboveCents: 3000, // gratuit au-dessus de 30 €
    allowedPostalCodes: ['42300', '42120', '42370', '42153'],
  },

  social: {
    snapchat: 'Amandefacile',
    instagram: '',
    facebook: '',
    telegram: '',
  },

  seo: {
    title: 'Eleven Shop — Épicerie de nuit Roanne | Livraison 24h/24',
    description:
      'Commandez vos boissons, snacks et produits du quotidien. Livraison rapide à Roanne et alentours, 24h/24, 7j/7.',
    keywords: [
      'épicerie de nuit',
      'Roanne',
      'livraison',
      '24h/24',
      'boissons',
      'snacks',
      'épicerie livraison Roanne',
    ],
  },
} as const;
