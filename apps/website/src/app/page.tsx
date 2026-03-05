import Link from 'next/link';
import ImpactCounter from '@/components/ImpactCounter';
import { ArrowRight, Recycle, Truck, DollarSign, Leaf } from 'lucide-react';

const steps = [
  { icon: Recycle, title: 'Соберите', desc: 'Отделите пластик, картон и бумагу от обычного мусора' },
  { icon: Truck, title: 'Мы заберем', desc: 'Оставьте заявку — наш работник приедет в удобное время' },
  { icon: DollarSign, title: 'Получите оплату', desc: 'Мы платим 5 сом/кг за пластиковые бутылки' },
  { icon: Leaf, title: 'Спасите природу', desc: 'Ваши материалы переработаны, а не сожжены' },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary to-primary-light py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight">
            Чистый Нарын —<br />наша общая цель
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
            Мы собираем пластик, картон и бумагу у жителей Нарына. Не сжигайте — сдавайте нам!
            Вместе мы делаем наш город чище.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/request"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-eco-light transition-colors"
            >
              Оставить заявку
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Узнать больше
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-eco-bg">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-eco-text text-center mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-eco-light rounded-2xl mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-accent mb-1">Шаг {i + 1}</div>
                  <h3 className="text-lg font-semibold text-eco-text">{step.title}</h3>
                  <p className="text-sm text-eco-gray mt-2">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact counter */}
      <ImpactCounter />

      {/* CTA */}
      <section className="py-20 bg-eco-bg">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-eco-text mb-4">Готовы начать?</h2>
          <p className="text-eco-gray mb-8">
            Оставьте заявку на сбор прямо сейчас. Наш работник приедет к вам и заберет материалы.
            Это бесплатно — мы платим вам!
          </p>
          <Link
            href="/request"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
          >
            Оставить заявку на сбор
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
