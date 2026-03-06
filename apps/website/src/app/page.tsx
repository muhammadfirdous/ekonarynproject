import Link from 'next/link';
import ImpactCounter from '@/components/ImpactCounter';
import { ArrowRight, Recycle, Truck, DollarSign, Leaf, Scale, TrendingUp, Sparkles } from 'lucide-react';

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
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-50">
        {/* Decorative blurred circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-300/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-6">
                <span>♻</span> Нарын, Кыргызстан
              </span>

              <h1 className="text-5xl lg:text-[56px] font-extrabold text-neutral-900 leading-[1.1] tracking-tight">
                Чистый Нарын —
                <br />
                <span className="text-brand-700">наша общая цель</span>
              </h1>

              <p className="mt-6 text-lg text-neutral-500 max-w-[480px] leading-relaxed">
                Мы собираем пластик, картон и бумагу у жителей Нарына.
                Не сжигайте — сдавайте нам! Вместе мы делаем наш город чище.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/request"
                  className="inline-flex items-center justify-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-900 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-200"
                >
                  Оставить заявку
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 bg-white text-neutral-700 border border-neutral-200 px-6 py-3 rounded-xl font-semibold hover:border-brand-300 hover:text-brand-700 transition-all duration-200"
                >
                  Узнать больше
                </Link>
              </div>
            </div>

            {/* Right: Floating stat cards */}
            <div className="relative hidden lg:block h-[400px]">
              {/* Card 1 — top left */}
              <div className="absolute top-8 left-4 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-glass w-56 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">5 тонн</p>
                    <p className="text-sm text-neutral-500">Собрано за год</p>
                  </div>
                </div>
              </div>

              {/* Card 2 — middle right */}
              <div className="absolute top-[140px] right-0 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-glass w-56 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">5 → 10 сом</p>
                    <p className="text-sm text-neutral-500">За бутылку</p>
                  </div>
                </div>
              </div>

              {/* Card 3 — bottom center */}
              <div className="absolute bottom-8 left-12 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-glass w-60 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">Нарын чище</p>
                    <p className="text-sm text-neutral-500">Каждый день</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">Как это работает</h2>
            <p className="text-neutral-500 mt-3 max-w-lg mx-auto">
              Простой процесс в 4 шага — от сортировки до переработки
            </p>
          </div>

          {/* Steps with connecting line */}
          <div className="relative">
            {/* Dashed connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-brand-200" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="text-center relative">
                    {/* Number + Icon circle */}
                    <div className="relative inline-flex flex-col items-center">
                      <div className="w-20 h-20 bg-brand-50 border-2 border-brand-200 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                        <Icon className="h-8 w-8 text-brand-700" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 bg-brand-700 text-white text-xs font-bold rounded-full flex items-center justify-center z-20">
                        {i + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900">{step.title}</h3>
                    <p className="text-sm text-neutral-500 mt-2 max-w-[200px] mx-auto leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Impact counter */}
      <ImpactCounter />

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Готовы начать?</h2>
          <p className="text-neutral-500 mb-8 text-lg leading-relaxed">
            Оставьте заявку на сбор прямо сейчас. Наш работник приедет к вам и заберет материалы.
            Это бесплатно — мы платим вам!
          </p>
          <Link
            href="/request"
            className="inline-flex items-center gap-2 bg-brand-700 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-900 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-200 text-lg"
          >
            Оставить заявку на сбор
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
