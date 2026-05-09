'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { Bell, LogOut, Menu, Settings as SettingsIcon } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

type OpenMenu = null | 'notifications' | 'profile';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Auto-close mobile sidebar on route change.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch notifications once on mount so the unread-dot is accurate before
  // the user opens the panel.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get<{ data: Notification[] }>('/notifications', token)
      .then((res) => {
        if (!cancelled) setNotifications(res.data);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Close any open dropdown on outside click.
  useEffect(() => {
    if (!openMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openMenu]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const pageTitle = t(`pageTitles.${pathname}`) || '';
  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  const toggleNotifications = async () => {
    if (openMenu === 'notifications') {
      setOpenMenu(null);
      return;
    }
    setOpenMenu('notifications');
    if (!token) return;
    setNotifLoading(true);
    try {
      const res = await api.get<{ data: Notification[] }>('/notifications', token);
      setNotifications(res.data);
    } catch {
      // intentionally ignored — empty/null state handled below
    } finally {
      setNotifLoading(false);
    }
  };

  const markRead = async (id: string) => {
    if (!token) return;
    try {
      await api.post(`/notifications/${id}/read`, {}, token);
      setNotifications((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev,
      );
    } catch {
      // non-fatal — user can retry
    }
  };

  const handleSignOut = () => {
    setOpenMenu(null);
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64">
        <header
          ref={headerRef}
          className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 md:px-8 h-14 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 -ml-1 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Menu className="h-5 w-5 text-neutral-700" aria-hidden="true" />
            </button>
            <h2 className="text-[15px] font-semibold text-neutral-900 truncate">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label={t('a11y.notifications')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'notifications'}
                onClick={toggleNotifications}
                className="w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors relative"
              >
                <Bell className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread`}
                    className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"
                  />
                )}
              </button>
              {openMenu === 'notifications' && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {t('header.notificationsTitle')}
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading && notifications == null ? (
                      <div className="px-4 py-6 text-center text-sm text-neutral-500">…</div>
                    ) : !notifications || notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-neutral-500">
                        {t('header.notificationsEmpty')}
                      </div>
                    ) : (
                      <ul>
                        {notifications.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => !n.read && markRead(n.id)}
                              disabled={n.read}
                              className={`w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 disabled:hover:bg-transparent ${
                                n.read ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-neutral-900 truncate">
                                    {n.title}
                                  </div>
                                  <div className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                                    {n.body}
                                  </div>
                                </div>
                                {!n.read && (
                                  <span
                                    aria-hidden="true"
                                    className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0"
                                  />
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile / user menu */}
            <div className="relative">
              <button
                type="button"
                aria-label={t('a11y.userMenu')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'profile'}
                onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
                className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center hover:bg-brand-200 transition-colors"
              >
                <span className="text-xs font-bold text-brand-700">{user?.name?.[0] || 'A'}</span>
              </button>
              {openMenu === 'profile' && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <div className="text-sm font-semibold text-neutral-900 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">{user.phone}</div>
                    <div className="text-xs font-medium text-brand-700 mt-1">
                      {t(`roles.${user.role}`)}
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                      {t('header.settings')}
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {t('header.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
