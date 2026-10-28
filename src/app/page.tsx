import HeroCarousel from '@/components/hero/HeroCarousel';
import {
  OpenBanner,
  HowItWorks,
  PopularProducts,
} from '@/components/home/HomeSections';

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <OpenBanner />
      <HowItWorks />
      <PopularProducts />
    </>
  );
}
