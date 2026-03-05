import { Flame, Wind, Droplets, TreePine, Heart, AlertTriangle } from 'lucide-react';

const burnFacts = [
  {
    icon: Flame,
    title: 'Токсичные газы',
    desc: 'При сжигании пластика выделяются диоксины и фураны — одни из самых опасных ядов для человека.',
  },
  {
    icon: Wind,
    title: 'Загрязнение воздуха',
    desc: 'Дым от сжигания пластика содержит канцерогены, вызывающие рак, астму и заболевания легких.',
  },
  {
    icon: Droplets,
    title: 'Отравление почвы',
    desc: 'Пепел от сжигания попадает в почву и воду, отравляя их на десятилетия.',
  },
  {
    icon: Heart,
    title: 'Вред здоровью',
    desc: 'Дети и пожилые особенно уязвимы. Регулярное вдыхание дыма ведет к хроническим заболеваниям.',
  },
];

const recycleReasons = [
  {
    title: 'Экономия ресурсов',
    desc: 'Переработка 1 тонны пластика экономит 5774 кВт-ч электроэнергии и 16 баррелей нефти.',
  },
  {
    title: 'Сохранение лесов',
    desc: 'Переработка 1 тонны бумаги сохраняет 17 деревьев и 26 000 литров воды.',
  },
  {
    title: 'Меньше мусора',
    desc: 'Переработка уменьшает количество отходов на свалках, которые загрязняют почву и воду.',
  },
  {
    title: 'Дополнительный доход',
    desc: 'Мы платим за сданные материалы — это реальные деньги для вашей семьи.',
  },
  {
    title: 'Чистый Нарын',
    desc: 'Чем больше мы собираем, тем чище наш город и красивее наша природа.',
  },
  {
    title: 'Пример для детей',
    desc: 'Раздельный сбор учит детей ответственности за окружающую среду.',
  },
];

export default function EducationPage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-primary to-primary-light py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">Экообразование</h1>
          <p className="mt-4 text-lg text-white/80">Почему переработка важна и почему нельзя сжигать мусор</p>
        </div>
      </section>

      {/* Why not burn */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h2 className="text-2xl font-bold text-eco-text">Почему нельзя сжигать мусор?</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-card p-6 mb-8">
            <p className="text-red-800">
              В Нарыне многие жители сжигают мусор во дворах. Это <strong>очень опасно</strong> для
              здоровья всех, кто живет поблизости, особенно для детей и пожилых людей.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {burnFacts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <div key={i} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-eco-text">{fact.title}</h3>
                      <p className="text-sm text-eco-gray mt-1">{fact.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why recycle */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TreePine className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-eco-text">Почему переработка — это хорошо?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recycleReasons.map((reason, i) => (
              <div key={i} className="bg-eco-light rounded-card p-5">
                <h3 className="font-semibold text-primary">{reason.title}</h3>
                <p className="text-sm text-eco-gray mt-2">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline: Decomposition */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text mb-8 text-center">Сколько разлагается мусор?</h2>
          <div className="space-y-4 max-w-xl mx-auto">
            {[
              { material: 'Бумага', time: '2-5 месяцев', color: 'bg-green-500' },
              { material: 'Картон', time: '3-6 месяцев', color: 'bg-green-600' },
              { material: 'Хлопковая ткань', time: '1-5 лет', color: 'bg-yellow-500' },
              { material: 'Кожа', time: '25-40 лет', color: 'bg-orange-500' },
              { material: 'Алюминиевая банка', time: '80-100 лет', color: 'bg-red-400' },
              { material: 'ПЭТ бутылка', time: '400-450 лет', color: 'bg-red-600' },
              { material: 'Стекло', time: '1 000 000 лет', color: 'bg-red-800' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div className="flex-1 flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <span className="font-medium text-eco-text">{item.material}</span>
                  <span className="text-sm text-eco-gray">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Начните сегодня!</h2>
          <p className="text-white/80 mb-6">
            Не сжигайте мусор — сдайте нам. Мы заплатим за ваши материалы и позаботимся об их переработке.
          </p>
          <a
            href="/request"
            className="inline-flex bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-eco-light transition-colors"
          >
            Оставить заявку на сбор
          </a>
        </div>
      </section>
    </main>
  );
}
