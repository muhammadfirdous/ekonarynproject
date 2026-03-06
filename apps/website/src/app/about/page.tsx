import { Target, Heart, Users, Mountain } from 'lucide-react';

const team = [
  { name: 'Айбек Турсунов', role: 'Основатель и директор', desc: 'Экоактивист из Нарына с 5-летним опытом в сфере переработки отходов.' },
  { name: 'Нурбек Асанов', role: 'Старший сборщик', desc: 'Отвечает за маршруты сбора и логистику.' },
  { name: 'Талант Жумабеков', role: 'Сборщик', desc: 'Работает с жителями и обеспечивает качественный сбор материалов.' },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            Наша история
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            О компании Эко Нарын
          </h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl mx-auto">
            Маленькая компания с большой миссией — сделать Нарын чистым городом
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Наша история</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed text-[16px]">
            <p>
              Эко Нарын была основана в 2023 году группой энтузиастов, которые не могли больше
              смотреть на то, как жители сжигают пластик и мусор. В Нарыне — горном городе
              Кыргызстана с населением около 40 000 человек — не было системы раздельного сбора отходов.
            </p>
            <p>
              Мы начали с одного грузовика и двух работников. За первый год мы собрали более 5 тонн
              перерабатываемых материалов, которые были бы сожжены или выброшены на свалку.
            </p>
            <p>
              Сегодня мы покупаем пластиковые бутылки у жителей по 5 сом/кг и отвозим в Бишкек
              для переработки. Это создает дополнительный доход для семей и защищает окружающую среду.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900">Наши ценности</h2>
            <p className="text-neutral-500 mt-2">То, во что мы верим и ради чего работаем</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { icon: Target, title: 'Миссия', desc: 'Создать устойчивую систему переработки отходов в Нарыне' },
              { icon: Heart, title: 'Забота', desc: 'Мы заботимся о здоровье жителей и чистоте нашего города' },
              { icon: Users, title: 'Сообщество', desc: 'Работаем с жителями, школами и организациями' },
              { icon: Mountain, title: 'Природа', desc: 'Защищаем уникальную природу Нарынской области' },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 text-center border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">{v.title}</h3>
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900">Наша команда</h2>
            <p className="text-neutral-500 mt-2">Люди, которые делают Нарын чище</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                <div className="w-16 h-16 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl font-bold text-brand-700">{member.name[0]}</span>
                </div>
                <h3 className="font-semibold text-neutral-900">{member.name}</h3>
                <p className="text-sm text-brand-600 font-medium mt-0.5">{member.role}</p>
                <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
