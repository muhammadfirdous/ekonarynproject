'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  UserPlus,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useT, LanguageToggle } from '@/lib/i18n';

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
  pathname: string;
}) {
  return (
    <div className="mb-2">
      <div className="px-4 py-2">
        <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-widest">
          {label}
        </span>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
              active
                ? 'bg-brand-500/15 text-brand-400 font-medium border-l-[3px] border-brand-500 ml-[9px] pl-[9px]'
                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200',
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const t = useT();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const mainNavItems = [
    { href: '/', label: t('sidebar.overview'), icon: LayoutDashboard },
    { href: '/collections', label: t('sidebar.collections'), icon: Package },
    { href: '/requests', label: t('sidebar.requests'), icon: ClipboardList },
    { href: '/routes', label: t('sidebar.routes'), icon: MapPin },
    { href: '/trips', label: t('sidebar.trips'), icon: Truck },
  ];

  const managementNavItems = [
    { href: '/workers/pending', label: t('sidebar.pendingWorkers'), icon: UserPlus },
    { href: '/financial', label: t('sidebar.financial'), icon: DollarSign },
    { href: '/analytics', label: t('sidebar.analytics'), icon: BarChart3 },
    { href: '/activity', label: t('sidebar.activity'), icon: ScrollText },
  ];

  const directoryNavItems = [
    { href: '/workers', label: t('sidebar.workers'), icon: Users },
    { href: '/residents', label: t('sidebar.residents'), icon: Home },
    { href: '/materials', label: t('sidebar.materials'), icon: Boxes },
    { href: '/schedule', label: t('sidebar.schedule'), icon: Calendar },
    { href: '/settings', label: t('sidebar.settings'), icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-700 rounded-lg flex items-center justify-center">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white leading-tight">{t('brand')}</h1>
            <p className="text-[11px] text-neutral-500">{t('brandSub')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <NavSection label={t('sidebar.sectionMain')} items={mainNavItems} pathname={pathname} />
        <NavSection
          label={t('sidebar.sectionManagement')}
          items={managementNavItems}
          pathname={pathname}
        />
        <NavSection
          label={t('sidebar.sectionDirectories')}
          items={directoryNavItems}
          pathname={pathname}
        />
      </nav>

      {/* User area */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <LanguageToggle variant="dark" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{user?.name?.[0] || 'A'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-neutral-500">{t(`roles.${user?.role || 'ADMIN'}`)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors duration-150 w-full px-1"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
}
