'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  MapPin,
  Truck,
  DollarSign,
  BarChart3,
  Users,
  Home,
  Boxes,
  Calendar,
  Settings,
  LogOut,
  Recycle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/', label: 'Обзор', icon: LayoutDashboard },
  { href: '/collections', label: 'Сборы', icon: Package },
  { href: '/requests', label: 'Заявки', icon: ClipboardList },
  { href: '/routes', label: 'Маршруты', icon: MapPin },
  { href: '/trips', label: 'Рейсы', icon: Truck },
  { href: '/financial', label: 'Финансы', icon: DollarSign },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/workers', label: 'Работники', icon: Users },
  { href: '/residents', label: 'Жители', icon: Home },
  { href: '/materials', label: 'Материалы', icon: Boxes },
  { href: '/schedule', label: 'Расписание', icon: Calendar },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary text-white flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Recycle className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-lg font-bold">Эко Нарын</h1>
            <p className="text-xs text-white/60">Панель управления</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-sm text-white/70 mb-2 truncate">{user?.name}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
