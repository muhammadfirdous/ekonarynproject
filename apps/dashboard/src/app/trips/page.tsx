'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate, formatMoney, formatWeight } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

interface Trip {
  id: string;
  date: string;
  destination: string;
  totalWeightKg: number;
  transportCost: number;
  revenue: number;
  worker: { name: string };
  collections: unknown[];
}

const columns: ColumnDef<Trip, unknown>[] = [
  { accessorKey: 'date', header: 'Дата', cell: ({ row }) => formatDate(row.original.date) },
  { accessorKey: 'worker.name', header: 'Водитель', cell: ({ row }) => row.original.worker?.name || '—' },
  { accessorKey: 'destination', header: 'Пункт назначения' },
  { accessorKey: 'totalWeightKg', header: 'Общий вес', cell: ({ row }) => formatWeight(row.original.totalWeightKg) },
  { accessorKey: 'transportCost', header: 'Расходы', cell: ({ row }) => formatMoney(row.original.transportCost) },
  { accessorKey: 'revenue', header: 'Выручка', cell: ({ row }) => formatMoney(row.original.revenue) },
  {
    id: 'profit',
    header: 'Прибыль',
    cell: ({ row }) => {
      const profit = row.original.revenue - row.original.transportCost;
      return <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(profit)}</span>;
    },
  },
];

export default function TripsPage() {
  const { token } = useAuth();
  const { data, loading, refetch } = useApi<Trip[]>('/trips');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', destination: 'Bishkek', totalWeightKg: '', transportCost: '15000', revenue: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/trips', {
        date: new Date(form.date).toISOString(),
        destination: form.destination,
        totalWeightKg: parseFloat(form.totalWeightKg) || 0,
        transportCost: parseFloat(form.transportCost) || 0,
        revenue: parseFloat(form.revenue) || 0,
      }, token!);
      setShowForm(false);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Рейсы"
        description="Рейсы в Бишкек для продажи материалов"
        action={
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-900">
            <Plus className="h-4 w-4" /> Новый рейс
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Дата</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Назначение</label>
              <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Общий вес (кг)</label>
              <input type="number" value={form.totalWeightKg} onChange={(e) => setForm((f) => ({ ...f, totalWeightKg: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Расходы на транспорт (сом)</label>
              <input type="number" value={form.transportCost} onChange={(e) => setForm((f) => ({ ...f, transportCost: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Выручка (сом)</label>
              <input type="number" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-brand-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Создать рейс'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-neutral-200 rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder="Поиск по рейсам..." />
      )}
    </DashboardLayout>
  );
}
