'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useT } from '@/lib/i18n';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  address: string | null;
  points: number;
  createdAt: string;
}

export default function WorkersPage() {
  const t = useT();
  const { data, loading } = useApi<User[]>('/users?role=WORKER');

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'name', header: t('workers.colName') },
    { accessorKey: 'phone', header: t('workers.colPhone') },
    { accessorKey: 'address', header: t('workers.colAddress'), cell: ({ row }) => row.original.address || '—' },
    { accessorKey: 'createdAt', header: t('workers.colCreatedAt'), cell: ({ row }) => formatDate(row.original.createdAt) },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('workers.title')} description={t('workers.description')} />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder={t('workers.searchPlaceholder')} />
      )}
    </DashboardLayout>
  );
}
