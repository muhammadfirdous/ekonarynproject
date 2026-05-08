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

interface Worker {
  id: string;
  name: string;
  phone: string;
  accountStatus: string;
  onShift: boolean;
}

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  status: string;
  notes: string | null;
  createdAt: string;
  resident: { name: string; phone: string };
  material: { name: string; nameRu: string };
  assignedWorker?: { id: string; name: string } | null;
}

export default function RequestsPage() {
  const t = useT();
  const { lang } = useLang();
  const { token } = useAuth();
  const [filter, setFilter] = useState('');
  const { data, loading, refetch } = useApi<Request[]>(
    `/requests?limit=100${filter ? `&status=${filter}` : ''}`,
  );
  const { data: workers } = useApi<Worker[]>('/users?role=WORKER&accountStatus=ACTIVE&limit=200');

  const [assigningId, setAssigningId] = useState<string | null>(null);

  const transition = async (id: string, status: string, reason?: string) => {
    try {
      await api.put(`/requests/${id}/status`, { status, ...(reason ? { reason } : {}) }, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    }
  };

  const assign = async (id: string, workerId: string) => {
    try {
      await api.post(`/requests/${id}/assign`, { workerId }, token!);
      setAssigningId(null);
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
      cell: ({ row }) =>
        (lang === 'ru' ? row.original.material?.nameRu : row.original.material?.name) || '—',
    },
    {
      accessorKey: 'estimatedQty',
      header: t('requests.colQty'),
      cell: ({ row }) => formatWeight(row.original.estimatedQty),
    },
    { accessorKey: 'address', header: t('requests.colAddress') },
    {
      id: 'assignedWorker',
      header: t('requests.colWorker'),
      cell: ({ row }) => row.original.assignedWorker?.name || '—',
    },
    {
      accessorKey: 'status',
      header: t('requests.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: t('requests.colActions'),
      cell: ({ row }) => {
        const req = row.original;
        const s = req.status;
        const isAssignable = s === 'pending' || s === 'accepted';
        const isInProgress = s === 'assigned' || s === 'in_progress';

        if (assigningId === req.id) {
          const eligible = (workers || []).filter((w) => w.onShift && w.accountStatus === 'ACTIVE');
          return (
            <div className="flex gap-1.5 items-center">
              <select
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) assign(req.id, e.target.value);
                }}
              >
                <option value="" disabled>
                  {t('requests.pickWorker')}
                </option>
                {eligible.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAssigningId(null)}
                className="text-xs px-2 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          );
        }

        return (
          <div className="flex gap-1.5 flex-wrap">
            {isAssignable && (
              <button
                onClick={() => setAssigningId(req.id)}
                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
              >
                {t('requests.actionAssign')}
              </button>
            )}
            {s === 'assigned' && (
              <button
                onClick={() => transition(req.id, 'in_progress')}
                className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium"
              >
                {t('requests.actionStart')}
              </button>
            )}
            {s === 'in_progress' && (
              <button
                onClick={() => transition(req.id, 'completed')}
                className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100 transition-colors font-medium"
              >
                {t('requests.actionComplete')}
              </button>
            )}
            {(isAssignable || isInProgress) && (
              <button
                onClick={() => {
                  const reason = prompt(t('requests.cancelReason'));
                  if (reason) transition(req.id, 'cancelled', reason);
                }}
                className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-100 transition-colors font-medium"
              >
                {t('requests.actionCancel')}
              </button>
            )}
            {isInProgress && (
              <button
                onClick={() => {
                  const reason = prompt(t('requests.failReason'));
                  if (reason) transition(req.id, 'failed', reason);
                }}
                className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors font-medium"
              >
                {t('requests.actionFail')}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filterButtons: Array<{ key: string; label: string }> = [
    { key: '', label: t('common.all') },
    { key: 'pending', label: t('statusFilters.pending') },
    { key: 'assigned', label: t('statusFilters.assigned') },
    { key: 'in_progress', label: t('statusFilters.in_progress') },
    { key: 'completed', label: t('statusFilters.completed') },
    { key: 'cancelled', label: t('statusFilters.cancelled') },
    { key: 'rejected', label: t('statusFilters.rejected') },
    { key: 'failed', label: t('statusFilters.failed') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('requests.title')} description={t('requests.description')} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {filterButtons.map((b) => (
          <button
            key={b.key || 'all'}
            onClick={() => setFilter(b.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              filter === b.key
                ? 'bg-brand-700 text-white'
                : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable
          columns={columns}
          data={data || []}
          searchPlaceholder={t('requests.searchPlaceholder')}
        />
      )}
    </DashboardLayout>
  );
}
