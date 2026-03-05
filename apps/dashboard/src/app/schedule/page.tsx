'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Plus, Pencil } from 'lucide-react';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
}

export default function SchedulePage() {
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
      alert(err instanceof Error ? err.message : 'Failed');
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
        title="Расписание"
        description="Расписание сбора по районам"
        action={
          <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light">
            <Plus className="h-4 w-4" /> Добавить
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Район</label>
              <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="напр. Центр" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">День недели</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg">
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Время</label>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm">Активно</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50">{saving ? 'Сохранение...' : editing ? 'Обновить' : 'Создать'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2 border border-gray-200 rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-card p-6 h-24 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([area, schedules]) => (
            <div key={area} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-eco-text mb-3">{area}</h3>
              <div className="flex flex-wrap gap-3">
                {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 bg-eco-light px-4 py-2 rounded-lg cursor-pointer hover:bg-green-100"
                    onClick={() => startEdit(s)}
                  >
                    <span className="font-medium text-primary">{DAYS[s.dayOfWeek]}</span>
                    <span className="text-eco-text">{s.time}</span>
                    <Pencil className="h-3 w-3 text-eco-gray" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="bg-white rounded-card p-8 text-center text-eco-gray">Нет расписания</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
