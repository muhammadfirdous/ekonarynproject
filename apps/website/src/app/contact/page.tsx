'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function ContactPage() {
  const t = useT();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors';

  const items = [
    { icon: Phone, title: t('contact.phoneTitle'), lines: ['+996 700 000 001', t('contact.phoneAlt')] },
    { icon: Mail, title: t('contact.emailTitle'), lines: ['info@ekonaryn.kg'] },
    { icon: MapPin, title: t('contact.addressTitle'), lines: [t('contact.addressLine1'), t('contact.addressLine2')] },
    { icon: Clock, title: t('contact.hoursTitle'), lines: [t('contact.hoursWeekdays'), t('contact.hoursSat'), t('contact.hoursSun')] },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            {t('contact.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">{t('contact.title')}</h1>
          <p className="mt-4 text-lg text-neutral-500">{t('contact.sub')}</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-6">{t('contact.howTitle')}</h2>

              <div className="space-y-5">
                {items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center">
                        <Icon className="h-5 w-5 text-brand-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-sm">{item.title}</h3>
                        {item.lines.map((line, j) => (
                          <p key={j} className="text-neutral-500 text-sm">{line}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Map placeholder */}
              <div className="mt-8 bg-brand-50 rounded-2xl border border-brand-100 overflow-hidden">
                <div className="h-56 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-10 w-10 text-brand-700 mx-auto mb-2" />
                    <p className="font-medium text-neutral-900 text-sm">{t('contact.mapAddress')}</p>
                    <p className="text-xs text-neutral-500 mt-1">41.4287° N, 75.9911° E</p>
                    <a
                      href="https://maps.google.com/?q=41.4287,75.9911"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium transition-colors"
                    >
                      {t('contact.openMaps')}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-6">{t('contact.formTitle')}</h2>

              {sent ? (
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-8 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-2xl mb-4">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">{t('contact.sentTitle')}</h3>
                  <p className="text-neutral-500 mt-2 text-sm">{t('contact.sentSub')}</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }); }}
                    className="mt-4 text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors"
                  >
                    {t('contact.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('contact.name')}</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={t('contact.namePlaceholder')}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('contact.phone')}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder={t('contact.phonePlaceholder')}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('contact.message')}</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder={t('contact.messagePlaceholder')}
                        rows={5}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 inline-flex items-center justify-center gap-2 bg-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-brand-900 hover:-translate-y-[1px] transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                    {t('contact.submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
