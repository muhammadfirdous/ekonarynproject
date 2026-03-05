'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API endpoint or email service
    setSent(true);
  };

  return (
    <main>
      <section className="bg-gradient-to-br from-primary to-primary-light py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">Контакты</h1>
          <p className="mt-4 text-lg text-white/80">Свяжитесь с нами любым удобным способом</p>
        </div>
      </section>

      <section className="py-16 bg-eco-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <h2 className="text-2xl font-bold text-eco-text mb-6">Как с нами связаться</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-eco-light rounded-xl flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text">Телефон</h3>
                    <p className="text-eco-gray">+996 700 000 001</p>
                    <p className="text-sm text-eco-gray mt-1">Также доступен WhatsApp</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-eco-light rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text">Email</h3>
                    <p className="text-eco-gray">info@ekonaryn.kg</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-eco-light rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text">Адрес</h3>
                    <p className="text-eco-gray">г. Нарын, ул. Ленина 45</p>
                    <p className="text-sm text-eco-gray mt-1">Нарынская область, Кыргызская Республика</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-eco-light rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text">Часы работы</h3>
                    <p className="text-eco-gray">Пн-Пт: 09:00 - 18:00</p>
                    <p className="text-eco-gray">Сб: 09:00 - 14:00</p>
                    <p className="text-eco-gray">Вс: выходной</p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-8 bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-eco-light h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="font-medium text-eco-text">г. Нарын, ул. Ленина 45</p>
                    <p className="text-sm text-eco-gray mt-1">41.4287° N, 75.9911° E</p>
                    <a
                      href="https://maps.google.com/?q=41.4287,75.9911"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-3 text-sm text-primary hover:underline"
                    >
                      Открыть в Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="text-2xl font-bold text-eco-text mb-6">Напишите нам</h2>

              {sent ? (
                <div className="bg-white rounded-card border border-gray-100 shadow-sm p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-eco-text">Сообщение отправлено!</h3>
                  <p className="text-eco-gray mt-2">Мы свяжемся с вами в ближайшее время.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }); }}
                    className="mt-4 text-primary hover:underline text-sm"
                  >
                    Отправить ещё
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-eco-text mb-1.5">Имя</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ваше имя"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-eco-text mb-1.5">Телефон</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+996 700 123 456"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-eco-text mb-1.5">Сообщение</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Ваше сообщение..."
                      rows={5}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    Отправить
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
