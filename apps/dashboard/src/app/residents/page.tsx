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
  address: string | null;
  points: number;
  createdAt: string;
}

export default function ResidentsPage() {
  const t = useT();
  const { data, loading } = useApi<User[]>('/users?role=RESIDENT');

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'name', header: t('residents.colName') },
    { accessorKey: 'phone', header: t('residents.colPhone') },
    { accessorKey: 'address', header: t('residents.colAddress'), cell: ({ row }) => row.original.address || '—' },
    {
      accessorKey: 'points',
      header: t('residents.colPoints'),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full text-sm font-medium">
          {row.original.points}
        </span>
      ),
    },
    { accessorKey: 'createdAt', header: t('residents.colCreatedAt'), cell: ({ row }) => formatDate(row.original.createdAt) },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('residents.title')} description={t('residents.description')} />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder={t('residents.searchPlaceholder')} />
      )}
    </DashboardLayout>
  );
}
