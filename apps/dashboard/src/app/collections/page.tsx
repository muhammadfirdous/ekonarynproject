'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { useApi } from '@/lib/hooks';
import { formatDate, formatWeight } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';

interface Collection {
  id: string;
  actualWeightKg: number;
  collectedAt: string;
  notes: string | null;
  material: { name: string; nameRu: string };
  worker: { name: string };
  request: { resident: { name: string; phone: string } };
}

export default function CollectionsPage() {
  const t = useT();
  const { lang } = useLang();
  const { data, loading } = useApi<Collection[]>('/collections?limit=100');

  const columns: ColumnDef<Collection, unknown>[] = [
    {
      accessorKey: 'collectedAt',
      header: t('collections.colDate'),
      cell: ({ row }) => formatDate(row.original.collectedAt),
    },
    {
      accessorKey: 'request.resident.name',
      header: t('collections.colResident'),
      cell: ({ row }) => row.original.request?.resident?.name || '—',
    },
    {
      accessorKey: 'material.nameRu',
      header: t('collections.colMaterial'),
      cell: ({ row }) => (lang === 'ru' ? row.original.material?.nameRu : row.original.material?.name) || '—',
    },
    {
      accessorKey: 'actualWeightKg',
      header: t('collections.colWeight'),
      cell: ({ row }) => formatWeight(row.original.actualWeightKg),
    },
    {
      accessorKey: 'worker.name',
      header: t('collections.colWorker'),
      cell: ({ row }) => row.original.worker?.name || '—',
    },
    {
      accessorKey: 'notes',
      header: t('collections.colNotes'),
      cell: ({ row }) => row.original.notes || '—',
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={t('collections.title')}
        description={t('collections.description')}
        action={
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl hover:bg-brand-900 hover:-translate-y-[1px] transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            {t('collections.newButton')}
          </Link>
        }
      />
      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <DataTable columns={columns} data={data || []} searchPlaceholder={t('collections.searchPlaceholder')} />
      )}
    </DashboardLayout>
  );
}
