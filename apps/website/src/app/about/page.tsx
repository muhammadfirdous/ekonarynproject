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
      <section className="bg-gradient-to-br from-primary to-primary-light py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">О компании Эко Нарын</h1>
          <p className="mt-4 text-lg text-white/80">
            Маленькая компания с большой миссией — сделать Нарын чистым городом
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text mb-6">Наша история</h2>
          <div className="prose prose-lg text-eco-gray space-y-4">
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
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text text-center mb-10">Наши ценности</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Миссия', desc: 'Создать устойчивую систему переработки отходов в Нарыне' },
              { icon: Heart, title: 'Забота', desc: 'Мы заботимся о здоровье жителей и чистоте нашего города' },
              { icon: Users, title: 'Сообщество', desc: 'Работаем с жителями, школами и организациями' },
              { icon: Mountain, title: 'Природа', desc: 'Защищаем уникальную природу Нарынской области' },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-eco-bg rounded-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-eco-light rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-eco-text">{v.title}</h3>
                  <p className="text-sm text-eco-gray mt-2">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text text-center mb-10">Наша команда</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-card p-6 text-center border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-eco-light rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{member.name[0]}</span>
                </div>
                <h3 className="font-semibold text-eco-text">{member.name}</h3>
                <p className="text-sm text-accent font-medium">{member.role}</p>
                <p className="text-sm text-eco-gray mt-2">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
