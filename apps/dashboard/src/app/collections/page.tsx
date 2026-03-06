'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { formatDate, formatWeight } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Collection {
  id: string;
  actualWeightKg: number;
  collectedAt: string;
  notes: string | null;
  material: { nameRu: string };
  worker: { name: string };
  request: { resident: { name: string; phone: string } };
}

const columns: ColumnDef<Collection, unknown>[] = [
  {
    accessorKey: 'collectedAt',
    header: 'Дата',
    cell: ({ row }) => formatDate(row.original.collectedAt),
  },
  {
    accessorKey: 'request.resident.name',
    header: 'Житель',
    cell: ({ row }) => row.original.request?.resident?.name || '—',
  },
  {
    accessorKey: 'material.nameRu',
    header: 'Материал',
    cell: ({ row }) => row.original.material?.nameRu || '—',
  },
  {
    accessorKey: 'actualWeightKg',
    header: 'Вес',
    cell: ({ row }) => formatWeight(row.original.actualWeightKg),
  },
  {
    accessorKey: 'worker.name',
    header: 'Работник',
    cell: ({ row }) => row.original.worker?.name || '—',
  },
  {
    accessorKey: 'notes',
    header: 'Заметки',
    cell: ({ row }) => row.original.notes || '—',
  },
];

export default function CollectionsPage() {
  const { data, loading } = useApi<Collection[]>('/collections?limit=100');

  return (
    <DashboardLayout>
      <PageHeader
        title="Сборы"
        description="Все записи о сборе материалов"
        action={
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl hover:bg-brand-900 hover:-translate-y-[1px] transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Новый сбор
          </Link>
        }
      />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder="Поиск по сборам..." />
      )}
    </DashboardLayout>
  );
}
