import HeroCarousel from '@/components/hero/HeroCarousel';
import {
  OpenBanner,
  HowItWorks,
  PopularProducts,
} from '@/components/home/HomeSections';

export default function HomePage() {
  return (
    <>
      {/* H1 sémantique masqué visuellement — indexé par les moteurs de recherche */}
      <h1 className="sr-only">
        Eleven Shop — Épicerie de Nuit &amp; Livraison 24h/24 à Roanne (42300)
      </h1>
      <HeroCarousel />
      <OpenBanner />
      <HowItWorks />
      <PopularProducts />
    </>
  );
}
