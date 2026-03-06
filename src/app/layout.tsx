import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import PageViewTracker from '@/components/PageViewTracker';

const GA_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nilkanth Fashions – Custom Tailoring & South Asian Dresses in Canada',
    template: '%s | Nilkanth Fashions',
  },
  description:
    'Nilkanth Fashions offers bespoke custom tailoring for women and girls across Canada. Shop traditional salwar suits, bridal lehengas, western wear and more — all made to measure.',
  keywords: [
    'custom tailoring Canada', 'South Asian fashion Canada', 'bridal lehenga Canada',
    'salwar kameez tailoring', 'Indian dress Canada', 'women ethnic wear Canada',
    'bespoke tailoring Toronto', 'lehenga choli', 'anarkali suit', 'custom dress Canada',
  ],
  metadataBase: new URL('https://nilkanthfashion.ca'),
  openGraph: {
    type: 'website',
    url: 'https://nilkanthfashion.ca',
    title: 'Nilkanth Fashions – Custom Tailoring & South Asian Dresses in Canada',
    description: 'Bespoke custom tailoring for women and girls across Canada. Traditional, western, and bridal wear — all made to your measurements.',
    siteName: 'Nilkanth Fashions',
    images: [{ url: 'https://nilkanthfashion.ca/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nilkanth Fashions – Custom Tailoring in Canada',
    description: 'Bespoke South Asian fashion for women and girls across Canada.',
  },
  alternates: { canonical: 'https://nilkanthfashion.ca' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Business schema markup */}
        <Script id="schema-local-business" type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "ClothingStore",
            "name": "Nilkanth Fashions",
            "description": "Bespoke custom tailoring for women and girls across Canada. Traditional, western, and bridal South Asian wear made to your measurements.",
            "url": "https://nilkanthfashion.ca",
            "email": "nilkanthfashions1309@gmail.com",
            "areaServed": "Canada",
            "priceRange": "$$",
            "currenciesAccepted": "CAD",
            "openingHours": "Mo-Sa 10:00-19:00",
            "sameAs": [],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Custom Tailoring Collections",
              "itemListElement": [
                { "@type": "OfferCatalog", "name": "Women Traditional Wear" },
                { "@type": "OfferCatalog", "name": "Women Western Wear" },
                { "@type": "OfferCatalog", "name": "Girls Traditional Wear" },
                { "@type": "OfferCatalog", "name": "Girls Western Wear" },
                { "@type": "OfferCatalog", "name": "Bridal Wear" }
              ]
            }
          }
        `}</Script>

        {/* GA4 */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <AuthProvider>
          <ThemeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { borderRadius: '12px', background: '#1f2937', color: '#fff' },
                success: { iconTheme: { primary: '#ec4899', secondary: '#fff' } },
              }}
            />
            <PageViewTracker />
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
