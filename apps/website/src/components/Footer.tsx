import Link from 'next/link';
import { Recycle, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Recycle className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">Эко Нарын</span>
            </div>
            <p className="text-sm text-white/70">
              Делаем Нарын чище. Собираем и перерабатываем пластик, картон и бумагу.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Страницы</h3>
            <div className="space-y-2 text-sm text-white/70">
              <Link href="/about" className="block hover:text-white">О нас</Link>
              <Link href="/materials" className="block hover:text-white">Материалы</Link>
              <Link href="/schedule" className="block hover:text-white">Расписание</Link>
              <Link href="/education" className="block hover:text-white">Экообразование</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Услуги</h3>
            <div className="space-y-2 text-sm text-white/70">
              <Link href="/request" className="block hover:text-white">Оставить заявку</Link>
              <Link href="/schedule" className="block hover:text-white">График сбора</Link>
              <Link href="/materials" className="block hover:text-white">Цены на материалы</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Контакты</h3>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+996 700 000 001</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@ekonaryn.kg</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>г. Нарын, ул. Ленина 45</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/50">
          &copy; {new Date().getFullYear()} Эко Нарын. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
