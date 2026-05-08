'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useT } from '@/lib/i18n';
import Link from 'next/link';

interface Worker {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  accountStatus: string;
  onShift: boolean;
  points: number;
  createdAt: string;
}

export default function WorkersPage() {
  const t = useT();
  const { token } = useAuth();
  const { data, loading, refetch } = useApi<Worker[]>('/users?role=WORKER&limit=200');

  const suspend = async (id: string) => {
    const reason = prompt(t('workers.suspendReason'));
    if (!reason) return;
    try {
      await api.post(`/users/${id}/suspend`, { reason }, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    }
  };

  const reactivate = async (id: string) => {
    try {
      await api.post(`/users/${id}/reactivate`, {}, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    }
  };

  const columns: ColumnDef<Worker, unknown>[] = [
    { accessorKey: 'name', header: t('workers.colName') },
    { accessorKey: 'phone', header: t('workers.colPhone') },
    {
      accessorKey: 'address',
      header: t('workers.colAddress'),
      cell: ({ row }) => row.original.address || '—',
    },
    {
      accessorKey: 'accountStatus',
      header: t('workers.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.accountStatus} />,
    },
    {
      accessorKey: 'onShift',
      header: t('workers.colOnShift'),
      cell: ({ row }) => (row.original.onShift ? '✓' : '—'),
    },
    {
      accessorKey: 'createdAt',
      header: t('workers.colCreatedAt'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: t('workers.colActions'),
      cell: ({ row }) => {
        const w = row.original;
        if (w.accountStatus === 'ACTIVE') {
          return (
            <button
              onClick={() => suspend(w.id)}
              className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-100 font-medium"
            >
              {t('workers.actionSuspend')}
            </button>
          );
        }
        if (w.accountStatus === 'SUSPENDED') {
          return (
            <button
              onClick={() => reactivate(w.id)}
              className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100 font-medium"
            >
              {t('workers.actionReactivate')}
            </button>
          );
        }
        return <span className="text-xs text-neutral-400">—</span>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('workers.title')} description={t('workers.description')} />

      <div className="mb-4">
        <Link
          href="/workers/pending"
          className="inline-flex items-center bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100"
        >
          {t('workers.pendingApprovalsLink')} →
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
      ) : (
        <DataTable
          columns={columns}
          data={data || []}
          searchPlaceholder={t('workers.searchPlaceholder')}
        />
      )}
    </DashboardLayout>
  );
}
