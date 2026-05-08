'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface PendingWorker {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  idDocumentUrl: string | null;
  serviceAreas: string | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  vehicleCapacityKg: number | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
// /api/v1/uploads files are served from /uploads on the same origin.
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

export default function PendingWorkersPage() {
  const t = useT();
  const { token } = useAuth();
  const { data, loading, refetch } = useApi<PendingWorker[]>('/users/workers/pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/users/${id}/approve`, {}, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt(t('pendingWorkers.rejectReason'));
    if (!reason) return;
    setBusyId(id);
    try {
      await api.post(`/users/${id}/reject`, { reason }, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title={t('pendingWorkers.title')} description={t('pendingWorkers.description')} />

      {loading ? (
        <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
      ) : !data || data.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-neutral-500 border border-neutral-100">
          {t('pendingWorkers.empty')}
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((w) => {
            const areas = w.serviceAreas ? safeJsonArray(w.serviceAreas) : [];
            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 text-lg">{w.name}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {w.phone}
                      {w.email ? ` · ${w.email}` : ''}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {t('pendingWorkers.applied')}: {formatDate(w.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(w.id)}
                      disabled={busyId === w.id}
                      className="bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-900 disabled:opacity-50"
                    >
                      {t('pendingWorkers.approve')}
                    </button>
                    <button
                      onClick={() => reject(w.id)}
                      disabled={busyId === w.id}
                      className="bg-red-50 text-red-700 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      {t('pendingWorkers.reject')}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Field label={t('pendingWorkers.idNumber')} value={w.idNumber} />
                  <Field label={t('pendingWorkers.vehicleType')} value={w.vehicleType} />
                  <Field label={t('pendingWorkers.vehiclePlate')} value={w.vehiclePlate} />
                  <Field
                    label={t('pendingWorkers.capacity')}
                    value={w.vehicleCapacityKg ? `${w.vehicleCapacityKg} kg` : null}
                  />
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-500">{t('pendingWorkers.serviceAreas')}</p>
                    <p className="text-neutral-900">{areas.length > 0 ? areas.join(', ') : '—'}</p>
                  </div>
                </div>

                {w.idDocumentUrl && (
                  <div className="mt-4">
                    <a
                      href={`${API_ORIGIN}${w.idDocumentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-900 underline"
                    >
                      {t('pendingWorkers.viewDocument')}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-neutral-900">{value || '—'}</p>
    </div>
  );
}

function safeJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
