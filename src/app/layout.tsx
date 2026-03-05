import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import PageViewTracker from '@/components/PageViewTracker';

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
    default: 'Nilkanth Fashions | Premium Custom Tailoring for Women & Girls',
    template: '%s | Nilkanth Fashions',
  },
  description:
    'Nilkanth Fashions offers premium custom tailoring for women and girls across Canada. Explore traditional, western, and bridal designs crafted with precision and elegance.',
  keywords: ['custom tailoring', 'women fashion', 'bridal wear', 'Indian fashion Canada', 'lehenga', 'saree', 'anarkali'],
  metadataBase: new URL('https://nilkanthfashion.ca'),
  openGraph: {
    type: 'website',
    url: 'https://nilkanthfashion.ca',
    title: 'Nilkanth Fashions | Premium Custom Tailoring',
    description: 'Custom-made fashion for women and girls in Canada.',
    siteName: 'Nilkanth Fashions',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
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
