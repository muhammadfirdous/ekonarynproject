'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/utils';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useT, useLocalized, useLang } from '@/lib/i18n';

interface Material {
  id: string;
  name: string;
  nameRu: string;
  buyingPrice: number;
  unit: string;
}

function MaterialOption({ m }: { m: Material }) {
  const t = useT();
  const displayName = useLocalized(m, { ru: 'nameRu', en: 'name' });
  return (
    <option value={m.id}>
      {displayName} ({m.buyingPrice} {t('materials.currency')}/{m.unit})
    </option>
  );
}

export default function RequestPage() {
  const t = useT();
  useLang(); // ensure rerender on lang change for option labels
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
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone, password: form.password }),
        });
        if (!loginRes.ok) {
          throw new Error(t('request.errorLogin'));
        }
        const loginData = await loginRes.json();
        token = loginData.data.accessToken;
      }

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
        throw new Error(errData.error || t('request.errorCreate'));
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('request.errorGeneric'));
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
          <h1 className="text-2xl font-bold text-neutral-900">{t('request.successTitle')}</h1>
          <p className="mt-4 text-neutral-500 leading-relaxed">{t('request.successSub')}</p>
          <button
            onClick={() => {
              setStatus('idle');
              setForm({ name: '', phone: '+996', password: '', materialId: '', address: '', estimatedQty: '', notes: '' });
            }}
            className="mt-6 bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-900 transition-colors"
          >
            {t('request.successAnother')}
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
            {t('request.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">{t('request.title')}</h1>
          <p className="mt-4 text-lg text-neutral-500">{t('request.sub')}</p>
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
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.name')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t('request.namePlaceholder')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t('request.phonePlaceholder')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.password')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={t('request.passwordPlaceholder')}
                  minLength={6}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.material')}</label>
                <select
                  value={form.materialId}
                  onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">{t('request.materialChoose')}</option>
                  {materials.map((m) => (
                    <MaterialOption key={m.id} m={m} />
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.address')}</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder={t('request.addressPlaceholder')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.qty')}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={form.estimatedQty}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedQty: e.target.value }))}
                  placeholder={t('request.qtyPlaceholder')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder={t('request.notesPlaceholder')}
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
              {status === 'loading' ? t('request.submitting') : t('request.submit')}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
