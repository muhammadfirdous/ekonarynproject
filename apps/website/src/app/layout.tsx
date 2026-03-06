import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Эко Нарын - Recycling for a Cleaner Naryn',
  description:
    'Eko Naryn collects plastic, cardboard, and paper from residents in Naryn, Kyrgyzstan. Join us in making our city cleaner.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ky">
      <body className="font-sans antialiased bg-background">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
