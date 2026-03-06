'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Обзор',
  '/collections': 'Сборы',
  '/collections/new': 'Новый сбор',
  '/requests': 'Заявки',
  '/routes': 'Маршруты',
  '/trips': 'Рейсы',
  '/financial': 'Финансы',
  '/analytics': 'Аналитика',
  '/workers': 'Работники',
  '/residents': 'Жители',
  '/materials': 'Материалы',
  '/schedule': 'Расписание',
  '/settings': 'Настройки',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const pageTitle = pageTitles[pathname] || '';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 px-8 h-14 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-neutral-900">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors relative">
              <Bell className="h-4 w-4 text-neutral-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-brand-700">{user?.name?.[0] || 'A'}</span>
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
