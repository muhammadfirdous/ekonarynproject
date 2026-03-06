import Link from 'next/link';
import { Recycle, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">Эко Нарын</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Делаем Нарын чище. Собираем и перерабатываем пластик, картон и бумагу.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Страницы</h3>
            <div className="space-y-2.5">
              {[
                { href: '/about', label: 'О нас' },
                { href: '/materials', label: 'Материалы' },
                { href: '/schedule', label: 'Расписание' },
                { href: '/education', label: 'Экообразование' },
              ].map((link) => (
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
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Услуги</h3>
            <div className="space-y-2.5">
              {[
                { href: '/request', label: 'Оставить заявку' },
                { href: '/schedule', label: 'График сбора' },
                { href: '/materials', label: 'Цены на материалы' },
              ].map((link) => (
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
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Контакты</h3>
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
                <span>г. Нарын, ул. Ленина 45</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-600">
          &copy; {new Date().getFullYear()} Эко Нарын. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
