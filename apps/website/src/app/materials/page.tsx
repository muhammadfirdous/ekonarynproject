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
      <section className="bg-gradient-to-br from-primary to-primary-light py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">Материалы и цены</h1>
          <p className="mt-4 text-lg text-white/80">Что мы принимаем и сколько платим</p>
        </div>
      </section>

      {/* Prices */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text mb-8">Текущие цены</h2>
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-eco-text">{m.nameRu}</h3>
                  <p className="text-sm text-eco-gray">{m.nameKy}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{m.buyingPrice}</span>
                    <span className="text-eco-gray">сом/{m.unit}</span>
                  </div>
                  {m.description && <p className="mt-3 text-sm text-eco-gray">{m.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-card p-8 text-center text-eco-gray">
              Цены загружаются с сервера. Позвоните нам для уточнения: +996 700 000 001
            </div>
          )}
        </div>
      </section>

      {/* What we accept */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text mb-8">Что мы принимаем</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {acceptedItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  item.accepted ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
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
                  <p className="font-medium text-eco-text">{item.name}</p>
                  <p className="text-sm text-eco-gray">{item.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-eco-text mb-6">Как подготовить материалы</h2>
          <div className="bg-white rounded-card border border-gray-100 p-6 space-y-4">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-eco-light rounded-full flex items-center justify-center text-sm font-bold text-primary">1</span>
              <p className="text-eco-text">Ополосните бутылки и контейнеры водой — не нужно мыть идеально</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-eco-light rounded-full flex items-center justify-center text-sm font-bold text-primary">2</span>
              <p className="text-eco-text">Сплющите бутылки, чтобы они занимали меньше места</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-eco-light rounded-full flex items-center justify-center text-sm font-bold text-primary">3</span>
              <p className="text-eco-text">Сложите картон плоско, уберите скотч если возможно</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-eco-light rounded-full flex items-center justify-center text-sm font-bold text-primary">4</span>
              <p className="text-eco-text">Держите сухую бумагу отдельно от мокрых материалов</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
