'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/utils';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Material {
  id: string;
  nameRu: string;
  buyingPrice: number;
  unit: string;
}

export default function RequestPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState({
    name: '',
    phone: '+996',
    password: '',
    materialId: '',
    address: '',
    estimatedQty: '',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/materials`)
      .then((r) => r.json())
      .then((d) => setMaterials(d.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      // Register or login
      let token = '';
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, password: form.password, address: form.address }),
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        token = regData.data.accessToken;
      } else {
        // Try login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone, password: form.password }),
        });
        if (!loginRes.ok) {
          throw new Error('Не удалось войти. Проверьте номер телефона и пароль.');
        }
        const loginData = await loginRes.json();
        token = loginData.data.accessToken;
      }

      // Create pickup request
      const reqRes = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          materialId: form.materialId,
          address: form.address,
          estimatedQty: parseFloat(form.estimatedQty),
          notes: form.notes || undefined,
        }),
      });

      if (!reqRes.ok) {
        const errData = await reqRes.json();
        throw new Error(errData.error || 'Не удалось создать заявку');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors';

  if (status === 'success') {
    return (
      <main className="py-24 bg-background">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-2xl mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Заявка принята!</h1>
          <p className="mt-4 text-neutral-500 leading-relaxed">
            Спасибо за вашу заявку! Наш работник свяжется с вами и приедет для сбора материалов.
            Обычно это занимает 1-3 дня.
          </p>
          <button
            onClick={() => {
              setStatus('idle');
              setForm({ name: '', phone: '+996', password: '', materialId: '', address: '', estimatedQty: '', notes: '' });
            }}
            className="mt-6 bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-900 transition-colors"
          >
            Создать ещё одну заявку
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            Быстро и бесплатно
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">Заявка на сбор</h1>
          <p className="mt-4 text-lg text-neutral-500">Заполните форму — мы приедем и заберем материалы</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-lg mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-8">
            {status === 'error' && (
              <div className="mb-6 flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Ваше имя</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Асан Токторов"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+996700123456"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Пароль (для отслеживания заявки)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Материал</label>
                <select
                  value={form.materialId}
                  onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">Выберите материал</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameRu} ({m.buyingPrice} сом/{m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Адрес</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="ул. Ленина 12, кв 5"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Примерный вес (кг)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={form.estimatedQty}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedQty: e.target.value }))}
                  placeholder="5"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Заметки (необязательно)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Позвоните перед приходом..."
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full mt-6 bg-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-brand-900 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {status === 'loading' ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
