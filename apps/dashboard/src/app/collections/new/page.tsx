'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Material {
  id: string;
  nameRu: string;
}

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  resident: { name: string };
  material: { nameRu: string };
}

export default function NewCollectionPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { data: requests } = useApi<Request[]>('/requests?status=ASSIGNED&limit=50');
  const { data: materials } = useApi<Material[]>('/materials');

  const [form, setForm] = useState({ requestId: '', materialId: '', actualWeightKg: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/collections', {
        requestId: form.requestId,
        materialId: form.materialId,
        actualWeightKg: parseFloat(form.actualWeightKg),
        notes: form.notes || undefined,
      }, token!);
      router.push('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedRequest = requests?.find((r) => r.id === form.requestId);

  return (
    <DashboardLayout>
      <PageHeader title="Новый сбор" description="Записать новый сбор материалов" />

      <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6 max-w-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-eco-text mb-1.5">Заявка</label>
          <select
            value={form.requestId}
            onChange={(e) => {
              const req = requests?.find((r) => r.id === e.target.value);
              setForm((f) => ({ ...f, requestId: e.target.value, materialId: req?.material ? (materials?.find((m) => m.nameRu === req.material.nameRu)?.id || '') : f.materialId }));
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Выберите заявку</option>
            {requests?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.resident?.name} — {r.material?.nameRu} ({r.estimatedQty} кг) — {r.address}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-eco-text mb-1.5">Материал</label>
          <select
            value={form.materialId}
            onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Выберите материал</option>
            {materials?.map((m) => (
              <option key={m.id} value={m.id}>{m.nameRu}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-eco-text mb-1.5">Фактический вес (кг)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={form.actualWeightKg}
            onChange={(e) => setForm((f) => ({ ...f, actualWeightKg: e.target.value }))}
            placeholder={selectedRequest ? `Оценка: ${selectedRequest.estimatedQty} кг` : '0.0'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-eco-text mb-1.5">Заметки</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
