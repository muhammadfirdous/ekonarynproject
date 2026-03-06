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
  role: string;
  address: string | null;
  points: number;
  createdAt: string;
}

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'name', header: 'Имя' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'address', header: 'Адрес', cell: ({ row }) => row.original.address || '—' },
  { accessorKey: 'createdAt', header: 'Дата регистрации', cell: ({ row }) => formatDate(row.original.createdAt) },
];

export default function WorkersPage() {
  const { data, loading } = useApi<User[]>('/users?role=WORKER');

  return (
    <DashboardLayout>
      <PageHeader title="Работники" description="Управление работниками" />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder="Поиск по работникам..." />
      )}
    </DashboardLayout>
  );
}
