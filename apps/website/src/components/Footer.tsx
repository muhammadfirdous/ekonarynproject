'use client';

import Link from 'next/link';
import { Recycle, Phone, MapPin, Mail } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function Footer() {
  const t = useT();

  const pageLinks = [
    { href: '/about', label: t('nav.about') },
    { href: '/materials', label: t('nav.materials') },
    { href: '/schedule', label: t('nav.schedule') },
    { href: '/education', label: t('nav.education') },
  ];

  const serviceLinks = [
    { href: '/request', label: t('footer.serviceLeaveRequest') },
    { href: '/schedule', label: t('footer.servicePickupSchedule') },
    { href: '/materials', label: t('footer.servicePrices') },
  ];

  return (
    <footer className="bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">{t('brand')}</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              {t('footer.pages')}
            </h3>
            <div className="space-y-2.5">
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              {t('footer.services')}
            </h3>
            <div className="space-y-2.5">
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              {t('footer.contacts')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                <Phone className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <span>+996 700 000 001</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                <Mail className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <span>info@ekonaryn.kg</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                <MapPin className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <span>{t('contact.addressLine1')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-600">
          &copy; {new Date().getFullYear()} {t('brand')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
