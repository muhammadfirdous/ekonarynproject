import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';
import { LANG_COOKIE, type Lang } from '@/lib/lang-config';

export const metadata: Metadata = {
  title: 'Eko Naryn - Dashboard',
  description: 'Admin dashboard for Eko Naryn recycling operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const stored = cookies().get(LANG_COOKIE)?.value;
  const initialLang: Lang = stored === 'en' ? 'en' : 'ru';

  return (
    <html lang={initialLang} translate="no">
      <body className="font-sans antialiased">
        <LanguageProvider initialLang={initialLang}>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
