import type { Metadata } from 'next';
import CheckoutView from '@/components/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Votre Panier & Prise de Commande — Eleven Shop Roanne',
  description:
    'Validez votre panier et commandez en quelques clics. Livraison de nuit 24h/24 à Roanne et alentours. Paiement à la livraison.',
};

export default function CartCheckoutPage() {
  return <CheckoutView />;
}
