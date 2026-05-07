'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface FinancialRecord {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  monthly: Record<string, { income: number; expenses: number; profit: number }>;
}

const CATEGORY_KEYS: Record<string, string> = {
  sales: 'financial.catSales',
  transport: 'financial.catTransport',
  salary: 'financial.catSalary',
  fuel: 'financial.catFuel',
  purchases: 'financial.catPurchases',
  supplies: 'financial.catSupplies',
  maintenance: 'financial.catMaintenance',
  grant: 'financial.catGrant',
};

export default function FinancialPage() {
  const t = useT();
  const { token } = useAuth();
  const { data: records, loading, refetch } = useApi<FinancialRecord[]>('/financial');
  const { data: summary } = useApi<Summary>('/financial/summary');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'EXPENSE', amount: '', description: '', category: '', date: '' });
  const [saving, setSaving] = useState(false);

  const columns: ColumnDef<FinancialRecord, unknown>[] = [
    { accessorKey: 'date', header: t('financial.colDate'), cell: ({ row }) => formatDate(row.original.date) },
    {
      accessorKey: 'type',
      header: t('financial.colType'),
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          row.original.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.original.type === 'INCOME' ? t('financial.income') : t('financial.expense')}
        </span>
      ),
    },
    { accessorKey: 'description', header: t('financial.colDesc') },
    {
      accessorKey: 'category',
      header: t('financial.colCategory'),
      cell: ({ row }) => {
        const c = row.original.category;
        if (!c) return '—';
        const key = CATEGORY_KEYS[c];
        return key ? t(key) : c;
      },
    },
    {
      accessorKey: 'amount',
      header: t('financial.colAmount'),
      cell: ({ row }) => (
        <span className={row.original.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
          {row.original.type === 'INCOME' ? '+' : '-'}{formatMoney(row.original.amount)}
        </span>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/financial', {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category || undefined,
        date: new Date(form.date).toISOString(),
      }, token!);
      setShowForm(false);
      setForm({ type: 'EXPENSE', amount: '', description: '', category: '', date: '' });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t('financial.title')}
        description={t('financial.description')}
        action={
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-900">
            <Plus className="h-4 w-4" /> {t('financial.newButton')}
          </button>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title={t('financial.totalIncome')} value={formatMoney(summary.totalIncome)} icon={TrendingUp} />
          <StatsCard title={t('financial.totalExpenses')} value={formatMoney(summary.totalExpenses)} icon={TrendingDown} />
          <StatsCard
            title={t('financial.profit')}
            value={formatMoney(summary.profit)}
            icon={DollarSign}
            className={summary.profit >= 0 ? '' : 'border-red-200'}
          />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('financial.type')}</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg">
                <option value="INCOME">{t('financial.income')}</option>
                <option value="EXPENSE">{t('financial.expense')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('financial.amount')}</label>
              <input type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('financial.desc')}</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('financial.category')}</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg">
                <option value="">{t('financial.noCategory')}</option>
                {Object.entries(CATEGORY_KEYS).map(([k, key]) => (
                  <option key={k} value={k}>{t(key)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('financial.date')}</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-brand-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-neutral-200 rounded-lg">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={records || []} searchPlaceholder={t('financial.searchPlaceholder')} />
      )}
    </DashboardLayout>
  );
}
