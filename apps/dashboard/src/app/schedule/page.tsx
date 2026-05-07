'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Plus, Pencil } from 'lucide-react';
import { useT, useTArray } from '@/lib/i18n';

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
}

export default function SchedulePage() {
  const t = useT();
  const daysShort = useTArray('schedule.daysShort');
  const daysFull = useTArray('schedule.daysFull');
  const { token } = useAuth();
  const { data, loading, refetch } = useApi<Schedule[]>('/schedule');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ area: '', dayOfWeek: '1', time: '09:00', active: true });
  const [saving, setSaving] = useState(false);

  const startEdit = (s: Schedule) => {
    setEditing(s.id);
    setForm({ area: s.area, dayOfWeek: String(s.dayOfWeek), time: s.time, active: s.active });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { area: form.area, dayOfWeek: parseInt(form.dayOfWeek), time: form.time, active: form.active };
      if (editing) {
        await api.put(`/schedule/${editing}`, body, token!);
      } else {
        await api.post('/schedule', body, token!);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ area: '', dayOfWeek: '1', time: '09:00', active: true });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  // Group by area
  const grouped: Record<string, Schedule[]> = {};
  data?.forEach((s) => {
    if (!grouped[s.area]) grouped[s.area] = [];
    grouped[s.area].push(s);
  });

  return (
    <DashboardLayout>
      <PageHeader
        title={t('schedule.title')}
        description={t('schedule.description')}
        action={
          <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="inline-flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-900">
            <Plus className="h-4 w-4" /> {t('schedule.addButton')}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('schedule.area')}</label>
              <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder={t('schedule.areaPlaceholder')} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('schedule.dayOfWeek')}</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg">
                {daysFull.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('schedule.time')}</label>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg" required />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-brand-700" />
                <span className="text-sm">{t('schedule.active')}</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-brand-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">
              {saving ? t('common.saving') : editing ? t('common.update') : t('common.create')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2 border border-neutral-200 rounded-lg">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl p-6 h-24 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([area, schedules]) => (
            <div key={area} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">{area}</h3>
              <div className="flex flex-wrap gap-3">
                {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-green-100"
                    onClick={() => startEdit(s)}
                  >
                    <span className="font-medium text-brand-700">{daysShort[s.dayOfWeek]}</span>
                    <span className="text-neutral-900">{s.time}</span>
                    <Pencil className="h-3 w-3 text-neutral-500" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-neutral-500">{t('schedule.empty')}</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
