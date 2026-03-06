'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  points: number;
  createdAt: string;
}

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'name', header: 'Имя' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'address', header: 'Адрес', cell: ({ row }) => row.original.address || '—' },
  {
    accessorKey: 'points',
    header: 'Баллы',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full text-sm font-medium">
        {row.original.points}
      </span>
    ),
  },
  { accessorKey: 'createdAt', header: 'Регистрация', cell: ({ row }) => formatDate(row.original.createdAt) },
];

export default function ResidentsPage() {
  const { data, loading } = useApi<User[]>('/users?role=RESIDENT');

  return (
    <DashboardLayout>
      <PageHeader title="Жители" description="База данных жителей" />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder="Поиск по жителям..." />
      )}
    </DashboardLayout>
  );
}
