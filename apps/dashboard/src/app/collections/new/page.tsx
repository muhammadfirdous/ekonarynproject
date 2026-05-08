'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useT, useLang } from '@/lib/i18n';

interface Material {
  id: string;
  name: string;
  nameRu: string;
}

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  resident: { name: string };
  material: { name: string; nameRu: string };
}

export default function NewCollectionPage() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const { token } = useAuth();
  const { data: requests } = useApi<Request[]>('/requests?status=ASSIGNED&limit=50');
  const { data: materials } = useApi<Material[]>('/materials');

  const [form, setForm] = useState({
    requestId: '',
    materialId: '',
    actualWeightKg: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const matName = (m: { name: string; nameRu: string }) => (lang === 'ru' ? m.nameRu : m.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(
        '/collections',
        {
          requestId: form.requestId,
          materialId: form.materialId,
          actualWeightKg: parseFloat(form.actualWeightKg),
          notes: form.notes || undefined,
        },
        token!,
      );
      router.push('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  const selectedRequest = requests?.find((r) => r.id === form.requestId);

  return (
    <DashboardLayout>
      <PageHeader title={t('newCollection.title')} description={t('newCollection.description')} />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 max-w-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="newcollection-request"
            className="block text-sm font-medium text-neutral-900 mb-1.5"
          >
            {t('newCollection.request')}
          </label>
          <select
            id="newcollection-request"
            value={form.requestId}
            onChange={(e) => {
              const req = requests?.find((r) => r.id === e.target.value);
              setForm((f) => ({
                ...f,
                requestId: e.target.value,
                materialId: req?.material
                  ? materials?.find((m) => m.nameRu === req.material.nameRu)?.id || ''
                  : f.materialId,
              }));
            }}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          >
            <option value="">{t('newCollection.chooseRequest')}</option>
            {requests?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.resident?.name} — {matName(r.material)} ({r.estimatedQty} {t('common.kg')}) —{' '}
                {r.address}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="newcollection-material"
            className="block text-sm font-medium text-neutral-900 mb-1.5"
          >
            {t('newCollection.material')}
          </label>
          <select
            id="newcollection-material"
            value={form.materialId}
            onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          >
            <option value="">{t('newCollection.chooseMaterial')}</option>
            {materials?.map((m) => (
              <option key={m.id} value={m.id}>
                {matName(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="newcollection-weight"
            className="block text-sm font-medium text-neutral-900 mb-1.5"
          >
            {t('newCollection.actualWeight')}
          </label>
          <input
            id="newcollection-weight"
            type="number"
            step="0.1"
            min="0.1"
            value={form.actualWeightKg}
            onChange={(e) => setForm((f) => ({ ...f, actualWeightKg: e.target.value }))}
            placeholder={
              selectedRequest
                ? t('newCollection.estimateLabel', { qty: selectedRequest.estimatedQty })
                : t('newCollection.actualWeightPlaceholder')
            }
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="newcollection-notes"
            className="block text-sm font-medium text-neutral-900 mb-1.5"
          >
            {t('newCollection.notes')}
          </label>
          <textarea
            id="newcollection-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-900 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
