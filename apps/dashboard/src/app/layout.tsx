import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Эко Нарын - Dashboard',
  description: 'Admin dashboard for Eko Naryn recycling operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" translate="no">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
