'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Recycle, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/about', label: 'О нас' },
  { href: '/materials', label: 'Материалы' },
  { href: '/schedule', label: 'Расписание' },
  { href: '/education', label: 'Экообразование' },
  { href: '/contact', label: 'Контакты' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Recycle className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">Эко Нарын</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-eco-text hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
          <Link
            href="/request"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            Заявка на сбор
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-eco-text hover:text-primary py-1"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/request"
            onClick={() => setOpen(false)}
            className="block bg-primary text-white text-center px-4 py-2 rounded-lg font-medium"
          >
            Заявка на сбор
          </Link>
        </nav>
      )}
    </header>
  );
}
