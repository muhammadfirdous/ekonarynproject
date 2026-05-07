'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate, formatWeight } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useT, useLang } from '@/lib/i18n';

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  status: string;
  notes: string | null;
  createdAt: string;
  resident: { name: string; phone: string };
  material: { name: string; nameRu: string };
}

export default function RequestsPage() {
  const t = useT();
  const { lang } = useLang();
  const { token } = useAuth();
  const [filter, setFilter] = useState('');
  const { data, loading, refetch } = useApi<Request[]>(`/requests?limit=100${filter ? `&status=${filter}` : ''}`);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/requests/${id}/status`, { status }, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    }
  };

  const columns: ColumnDef<Request, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: t('requests.colDate'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'resident.name',
      header: t('requests.colResident'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.resident?.name}</p>
          <p className="text-xs text-neutral-500">{row.original.resident?.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'material.nameRu',
      header: t('requests.colMaterial'),
      cell: ({ row }) => (lang === 'ru' ? row.original.material?.nameRu : row.original.material?.name) || '—',
    },
    {
      accessorKey: 'estimatedQty',
      header: t('requests.colQty'),
      cell: ({ row }) => formatWeight(row.original.estimatedQty),
    },
    { accessorKey: 'address', header: t('requests.colAddress') },
    {
      accessorKey: 'status',
      header: t('requests.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: t('requests.colActions'),
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <div className="flex gap-1.5">
            {s === 'PENDING' && (
              <button
                onClick={() => updateStatus(row.original.id, 'ASSIGNED')}
                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
              >
                {t('requests.actionAssign')}
              </button>
            )}
            {s === 'ASSIGNED' && (
              <button
                onClick={() => updateStatus(row.original.id, 'COMPLETED')}
                className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100 transition-colors font-medium"
              >
                {t('requests.actionComplete')}
              </button>
            )}
            {(s === 'PENDING' || s === 'ASSIGNED') && (
              <button
                onClick={() => updateStatus(row.original.id, 'CANCELLED')}
                className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-100 transition-colors font-medium"
              >
                {t('requests.actionCancel')}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filterButtons: Array<{ key: string; label: string }> = [
    { key: '', label: t('common.all') },
    { key: 'PENDING', label: t('statusFilters.PENDING') },
    { key: 'ASSIGNED', label: t('statusFilters.ASSIGNED') },
    { key: 'COMPLETED', label: t('statusFilters.COMPLETED') },
    { key: 'CANCELLED', label: t('statusFilters.CANCELLED') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('requests.title')} description={t('requests.description')} />

      <div className="flex gap-2 mb-4">
        {filterButtons.map((b) => (
          <button
            key={b.key || 'all'}
            onClick={() => setFilter(b.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              filter === b.key ? 'bg-brand-700 text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder={t('requests.searchPlaceholder')} />
      )}
    </DashboardLayout>
  );
}
