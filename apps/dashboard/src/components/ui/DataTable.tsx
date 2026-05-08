'use client';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  searchColumn?: string;
}

export default function DataTable<T>({ columns, data, searchPlaceholder }: DataTableProps<T>) {
  const t = useT();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      {searchPlaceholder && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl w-full max-w-sm text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-neutral-100">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-3.5 text-left text-[13px] font-medium text-neutral-500 uppercase tracking-wide cursor-pointer select-none hover:text-neutral-900 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ChevronsUpDown className="h-3 w-3 text-neutral-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-neutral-500 text-sm"
                  >
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 text-sm text-neutral-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
          <span className="text-sm text-neutral-500">
            {t('common.page')} {table.getState().pagination.pageIndex + 1} {t('common.of')}{' '}
            {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={t('common.previousPage')}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t('common.nextPage')}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
