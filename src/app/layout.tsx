import { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import SmoothScroll from '@/components/layout/SmoothScroll';
import CartDrawer from '@/components/cart/CartDrawer';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: [...siteConfig.seo.keywords],
  openGraph: {
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    locale: siteConfig.locale,
    type: 'website',
    siteName: siteConfig.name,
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
        {/* Schema.org LocalBusiness — SEO local */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: siteConfig.name,
              description: siteConfig.description,
              url: siteConfig.url,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Roanne',
                postalCode: '42300',
                addressCountry: 'FR',
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                  'Friday', 'Saturday', 'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
              },
              priceRange: '€',
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
