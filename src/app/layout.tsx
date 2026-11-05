import { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import SmoothScroll from '@/components/layout/SmoothScroll';
import CartDrawer from '@/components/cart/CartDrawer';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.elevenshop.fr'),
  title: {
    default: siteConfig.seo.title,
    template: '%s | Eleven Shop Roanne',
  },
  description: siteConfig.seo.description,
  keywords: [...siteConfig.seo.keywords],
  alternates: {
    canonical: 'https://www.elevenshop.fr',
  },
  openGraph: {
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: 'https://www.elevenshop.fr',
    locale: 'fr_FR',
    type: 'website',
    siteName: siteConfig.name,
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Eleven Shop — Épicerie de nuit Roanne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: ['/icon.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'theme-color': '#0A0A0A',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Schema.org ConvenienceStore — SEO local enrichi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ConvenienceStore',
              name: siteConfig.name,
              description: siteConfig.seo.description,
              url: 'https://www.elevenshop.fr',
              logo: 'https://www.elevenshop.fr/icon.png',
              image: 'https://www.elevenshop.fr/icon.png',
              telephone: '+33759843041',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '21 rue Anatole France',
                addressLocality: 'Roanne',
                postalCode: '42300',
                addressRegion: 'Loire',
                addressCountry: 'FR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 46.0357,
                longitude: 4.0734,
              },
              areaServed: [
                { '@type': 'City', name: 'Roanne' },
                { '@type': 'City', name: 'Riorges' },
                { '@type': 'City', name: 'Le Coteau' },
                { '@type': 'City', name: 'Mably' },
              ],
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                  'Friday', 'Saturday', 'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
              },
              servesCuisine: 'Épicerie, Boissons, Snacks',
              priceRange: '€',
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Catalogue Eleven Shop',
                url: 'https://www.elevenshop.fr/catalogue',
              },
              sameAs: [
                'https://elevenshop.fr',
              ],
            }),
          }}
        />
      </head>
      <body className="safe-bottom">
        <SmoothScroll>
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <main>{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <CartDrawer />
        </SmoothScroll>
      </body>
    </html>
  );
}
