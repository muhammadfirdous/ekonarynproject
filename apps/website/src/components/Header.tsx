'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Recycle, Menu, X } from 'lucide-react';
import { useT, LanguageToggle } from '@/lib/i18n';

export default function Header() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/materials', label: t('nav.materials') },
    { href: '/schedule', label: t('nav.schedule') },
    { href: '/education', label: t('nav.education') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-neutral-200/50'
          : 'bg-white border-b border-neutral-200'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900">{t('brand')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-medium text-neutral-700 hover:text-brand-700 px-3 py-2 rounded-lg transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <LanguageToggle className="ml-3" />
          <Link
            href="/request"
            className="ml-3 bg-brand-700 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-brand hover:bg-brand-900 hover:-translate-y-[1px] hover:shadow-brand-lg transition-all duration-200"
          >
            {t('nav.cta')}
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          {open ? <X className="h-5 w-5 text-neutral-700" /> : <Menu className="h-5 w-5 text-neutral-700" />}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-neutral-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1">
          <div className="px-1 pb-2">
            <LanguageToggle />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-neutral-700 hover:text-brand-700 hover:bg-brand-50 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/request"
            onClick={() => setOpen(false)}
            className="block bg-brand-700 text-white text-center px-4 py-2.5 rounded-full font-semibold text-sm mt-3 shadow-brand"
          >
            {t('nav.cta')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
