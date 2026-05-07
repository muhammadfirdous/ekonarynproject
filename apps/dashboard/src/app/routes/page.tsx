'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MapPin, Plus, User } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Stop {
  address: string;
  order: number;
  notes?: string;
}

interface Route {
  id: string;
  date: string;
  status: string;
  stops: Stop[];
  worker: { id: string; name: string };
}

interface Worker {
  id: string;
  name: string;
  phone: string;
}

export default function RoutesPage() {
  const t = useT();
  const { token } = useAuth();
  const { data: routes, loading, refetch } = useApi<Route[]>('/routes');
  const { data: workers } = useApi<Worker[]>('/users?role=WORKER');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ workerId: '', date: '', stops: [{ address: '', order: 1, notes: '' }] });
  const [saving, setSaving] = useState(false);

  const addStop = () => {
    setForm((f) => ({ ...f, stops: [...f.stops, { address: '', order: f.stops.length + 1, notes: '' }] }));
  };

  const removeStop = (index: number) => {
    setForm((f) => ({ ...f, stops: f.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/routes', {
        workerId: form.workerId,
        date: new Date(form.date).toISOString(),
        stops: form.stops.filter((s) => s.address.trim()),
      }, token!);
      setShowForm(false);
      setForm({ workerId: '', date: '', stops: [{ address: '', order: 1, notes: '' }] });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t('routes.title')}
        description={t('routes.description')}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-900"
          >
            <Plus className="h-4 w-4" />
            {t('routes.newButton')}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">{t('routes.worker')}</label>
              <select
                value={form.workerId}
                onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg"
                required
              >
                <option value="">{t('routes.chooseWorker')}</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">{t('routes.date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg"
                required
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-neutral-900 mb-2">{t('routes.stops')}</label>
          {form.stops.map((stop, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="flex items-center justify-center w-8 h-10 bg-brand-50 rounded text-sm font-medium text-brand-700">
                {i + 1}
              </span>
              <input
                placeholder={t('routes.address')}
                value={stop.address}
                onChange={(e) => {
                  const stops = [...form.stops];
                  stops[i] = { ...stops[i], address: e.target.value };
                  setForm((f) => ({ ...f, stops }));
                }}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                required
              />
              <input
                placeholder={t('routes.note')}
                value={stop.notes}
                onChange={(e) => {
                  const stops = [...form.stops];
                  stops[i] = { ...stops[i], notes: e.target.value };
                  setForm((f) => ({ ...f, stops }));
                }}
                className="w-48 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              />
              {form.stops.length > 1 && (
                <button type="button" onClick={() => removeStop(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStop} className="text-sm text-brand-700 hover:underline mt-1 mb-4">
            {t('routes.addStop')}
          </button>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-brand-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">
              {saving ? t('common.saving') : t('routes.createButton')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-neutral-200 rounded-lg">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl p-6 h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {routes && routes.length > 0 ? (
            routes.map((route) => (
              <div key={route.id} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-neutral-500" />
                    <span className="font-medium">{route.worker?.name}</span>
                    <span className="text-sm text-neutral-500">· {formatDate(route.date)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {route.status === 'active' ? t('routes.statusActive') : t('routes.statusFinished')}
                  </span>
                </div>
                <div className="space-y-2">
                  {(route.stops as Stop[]).map((stop, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="flex items-center justify-center w-6 h-6 bg-brand-50 rounded-full text-xs font-medium text-brand-700 mt-0.5">
                        {stop.order}
                      </div>
                      <div>
                        <p className="text-neutral-900">{stop.address}</p>
                        {stop.notes && <p className="text-neutral-500 text-xs">{stop.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-neutral-500">{t('routes.empty')}</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
