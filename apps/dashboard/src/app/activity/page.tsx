'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useT } from '@/lib/i18n';

interface ActivityRow {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function ActivityPage() {
  const t = useT();
  const [actionFilter, setActionFilter] = useState('');
  const path = `/activity?limit=100${actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : ''}`;
  const { data, loading } = useApi<ActivityRow[]>(path, [actionFilter]);

  const actions = [
    'worker.registered',
    'worker.approved',
    'worker.rejected',
    'worker.suspended',
    'worker.reactivated',
    'request.created',
    'request.cancelled',
    'order.assigned',
    'order.reassigned',
    'order.status_changed',
    'auth.login',
    'auth.login_blocked',
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('activity.title')} description={t('activity.description')} />

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setActionFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            actionFilter === ''
              ? 'bg-brand-700 text-white'
              : 'bg-white border border-neutral-200 text-neutral-500'
          }`}
        >
          {t('common.all')}
        </button>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              actionFilter === a
                ? 'bg-brand-700 text-white'
                : 'bg-white border border-neutral-200 text-neutral-500'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{t('activity.colTime')}</th>
                <th className="px-4 py-3">{t('activity.colAction')}</th>
                <th className="px-4 py-3">{t('activity.colEntity')}</th>
                <th className="px-4 py-3">{t('activity.colActor')}</th>
                <th className="px-4 py-3">{t('activity.colMetadata')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(data || []).map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{row.entityType}</div>
                    <div className="text-xs text-neutral-400 truncate max-w-[12rem]">
                      {row.entityId || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{row.actorRole || '—'}</div>
                    <div className="text-xs text-neutral-400 truncate max-w-[12rem]">
                      {row.actorId || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <pre className="text-xs whitespace-pre-wrap max-w-md">{row.metadata || ''}</pre>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                    {t('activity.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
