import { API_URL } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  nameKy: string;
  nameRu: string;
  buyingPrice: number;
  sellingPrice: number;
  unit: string;
  description: string | null;
}

async function getMaterials(): Promise<Material[]> {
  try {
    const res = await fetch(`${API_URL}/materials`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

const acceptedItems = [
  { name: 'ПЭТ бутылки', examples: 'Бутылки от воды, газировки, соков', accepted: true },
  { name: 'HDPE пластик', examples: 'Бутылки от шампуня, моющих средств', accepted: true },
  { name: 'Картон', examples: 'Коробки, упаковка, гофрокартон', accepted: true },
  { name: 'Бумага', examples: 'Газеты, журналы, офисная бумага', accepted: true },
  { name: 'Стекло', examples: 'Бутылки, банки', accepted: false },
  { name: 'Металл', examples: 'Алюминиевые банки', accepted: false },
  { name: 'Пищевые отходы', examples: 'Остатки еды', accepted: false },
  { name: 'Батарейки', examples: 'Любые элементы питания', accepted: false },
];

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            Прайс-лист
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">Материалы и цены</h1>
          <p className="mt-4 text-lg text-neutral-500">Что мы принимаем и сколько платим</p>
        </div>
      </section>

      {/* Prices */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Текущие цены</h2>
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                  <h3 className="text-lg font-semibold text-neutral-900">{m.nameRu}</h3>
                  <p className="text-sm text-neutral-500">{m.nameKy}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-brand-700">{m.buyingPrice}</span>
                    <span className="text-neutral-500">сом/{m.unit}</span>
                  </div>
                  {m.description && <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{m.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-2xl p-8 text-center text-neutral-500 border border-neutral-100">
              Цены загружаются с сервера. Позвоните нам для уточнения: +996 700 000 001
            </div>
          )}
        </div>
      </section>

      {/* What we accept */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Что мы принимаем</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {acceptedItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 ${
                  item.accepted
                    ? 'border-green-200 bg-green-50/50 hover:bg-green-50'
                    : 'border-red-200 bg-red-50/50 hover:bg-red-50'
                }`}
              >
                <div className={`mt-0.5 ${item.accepted ? 'text-green-600' : 'text-red-400'}`}>
                  {item.accepted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-current text-xs font-bold">✕</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-500">{item.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Как подготовить материалы</h2>
          <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6 space-y-4">
            {[
              'Ополосните бутылки и контейнеры водой — не нужно мыть идеально',
              'Сплющите бутылки, чтобы они занимали меньше места',
              'Сложите картон плоско, уберите скотч если возможно',
              'Держите сухую бумагу отдельно от мокрых материалов',
            ].map((tip, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-neutral-700 pt-0.5">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
