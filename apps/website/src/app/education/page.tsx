import { Flame, Wind, Droplets, TreePine, Heart, AlertTriangle, ArrowRight } from 'lucide-react';

const burnFacts = [
  { icon: Flame, title: 'Токсичные газы', desc: 'При сжигании пластика выделяются диоксины и фураны — одни из самых опасных ядов для человека.' },
  { icon: Wind, title: 'Загрязнение воздуха', desc: 'Дым от сжигания пластика содержит канцерогены, вызывающие рак, астму и заболевания легких.' },
  { icon: Droplets, title: 'Отравление почвы', desc: 'Пепел от сжигания попадает в почву и воду, отравляя их на десятилетия.' },
  { icon: Heart, title: 'Вред здоровью', desc: 'Дети и пожилые особенно уязвимы. Регулярное вдыхание дыма ведет к хроническим заболеваниям.' },
];

const recycleReasons = [
  { title: 'Экономия ресурсов', desc: 'Переработка 1 тонны пластика экономит 5774 кВт-ч электроэнергии и 16 баррелей нефти.' },
  { title: 'Сохранение лесов', desc: 'Переработка 1 тонны бумаги сохраняет 17 деревьев и 26 000 литров воды.' },
  { title: 'Меньше мусора', desc: 'Переработка уменьшает количество отходов на свалках, которые загрязняют почву и воду.' },
  { title: 'Дополнительный доход', desc: 'Мы платим за сданные материалы — это реальные деньги для вашей семьи.' },
  { title: 'Чистый Нарын', desc: 'Чем больше мы собираем, тем чище наш город и красивее наша природа.' },
  { title: 'Пример для детей', desc: 'Раздельный сбор учит детей ответственности за окружающую среду.' },
];

export default function EducationPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            Узнайте больше
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">Экообразование</h1>
          <p className="mt-4 text-lg text-neutral-500">Почему переработка важна и почему нельзя сжигать мусор</p>
        </div>
      </section>

      {/* Why not burn */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Почему нельзя сжигать мусор?</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
            <p className="text-red-800 text-sm leading-relaxed">
              В Нарыне многие жители сжигают мусор во дворах. Это <strong>очень опасно</strong> для
              здоровья всех, кто живет поблизости, особенно для детей и пожилых людей.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {burnFacts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 hover:shadow-card-hover transition-shadow duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                      <Icon className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{fact.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{fact.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why recycle */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <TreePine className="h-5 w-5 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Почему переработка — это хорошо?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recycleReasons.map((reason, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-5 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                <h3 className="font-semibold text-brand-700 text-sm">{reason.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline: Decomposition */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-8 text-center">Сколько разлагается мусор?</h2>
          <div className="space-y-3 max-w-xl mx-auto">
            {[
              { material: 'Бумага', time: '2-5 месяцев', color: 'bg-green-500', width: 'w-[5%]' },
              { material: 'Картон', time: '3-6 месяцев', color: 'bg-green-600', width: 'w-[8%]' },
              { material: 'Хлопковая ткань', time: '1-5 лет', color: 'bg-yellow-500', width: 'w-[15%]' },
              { material: 'Кожа', time: '25-40 лет', color: 'bg-orange-500', width: 'w-[30%]' },
              { material: 'Алюминиевая банка', time: '80-100 лет', color: 'bg-red-400', width: 'w-[50%]' },
              { material: 'ПЭТ бутылка', time: '400-450 лет', color: 'bg-red-600', width: 'w-[80%]' },
              { material: 'Стекло', time: '1 000 000 лет', color: 'bg-red-800', width: 'w-full' },
            ].map((item, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-900 text-sm">{item.material}</span>
                  <span className="text-sm text-neutral-500 font-medium">{item.time}</span>
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} ${item.width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)` }} />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Начните сегодня!</h2>
          <p className="text-brand-300 mb-8 leading-relaxed">
            Не сжигайте мусор — сдайте нам. Мы заплатим за ваши материалы и позаботимся об их переработке.
          </p>
          <a
            href="/request"
            className="inline-flex items-center gap-2 bg-white text-brand-900 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
          >
            Оставить заявку на сбор
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
