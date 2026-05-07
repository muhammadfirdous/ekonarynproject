import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/i18n';
import { LANG_COOKIE, type Lang } from '@/lib/lang-config';

export const metadata: Metadata = {
  title: 'Eko Naryn - Recycling for a Cleaner Naryn',
  description:
    'Eko Naryn collects plastic, cardboard, and paper from residents in Naryn, Kyrgyzstan. Join us in making our city cleaner.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const stored = cookies().get(LANG_COOKIE)?.value;
  const initialLang: Lang = stored === 'en' ? 'en' : 'ru';

  return (
    <html lang={initialLang}>
      <body className="font-sans antialiased bg-background">
        <LanguageProvider initialLang={initialLang}>
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
