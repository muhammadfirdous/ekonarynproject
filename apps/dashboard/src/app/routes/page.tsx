'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MapPin, Plus, User } from 'lucide-react';

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
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Маршруты"
        description="Планирование маршрутов сбора"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" />
            Новый маршрут
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-eco-text mb-1.5">Работник</label>
              <select
                value={form.workerId}
                onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                required
              >
                <option value="">Выберите работника</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-eco-text mb-1.5">Дата</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                required
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-eco-text mb-2">Остановки</label>
          {form.stops.map((stop, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="flex items-center justify-center w-8 h-10 bg-eco-light rounded text-sm font-medium text-primary">
                {i + 1}
              </span>
              <input
                placeholder="Адрес"
                value={stop.address}
                onChange={(e) => {
                  const stops = [...form.stops];
                  stops[i] = { ...stops[i], address: e.target.value };
                  setForm((f) => ({ ...f, stops }));
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              />
              <input
                placeholder="Заметка"
                value={stop.notes}
                onChange={(e) => {
                  const stops = [...form.stops];
                  stops[i] = { ...stops[i], notes: e.target.value };
                  setForm((f) => ({ ...f, stops }));
                }}
                className="w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              {form.stops.length > 1 && (
                <button type="button" onClick={() => removeStop(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStop} className="text-sm text-primary hover:underline mt-1 mb-4">
            + Добавить остановку
          </button>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Создать маршрут'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-200 rounded-lg">
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-card p-6 h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {routes && routes.length > 0 ? (
            routes.map((route) => (
              <div key={route.id} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-eco-gray" />
                    <span className="font-medium">{route.worker?.name}</span>
                    <span className="text-sm text-eco-gray">· {formatDate(route.date)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {route.status === 'active' ? 'Активный' : 'Завершен'}
                  </span>
                </div>
                <div className="space-y-2">
                  {(route.stops as Stop[]).map((stop, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="flex items-center justify-center w-6 h-6 bg-eco-light rounded-full text-xs font-medium text-primary mt-0.5">
                        {stop.order}
                      </div>
                      <div>
                        <p className="text-eco-text">{stop.address}</p>
                        {stop.notes && <p className="text-eco-gray text-xs">{stop.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-card p-8 text-center text-eco-gray">Нет маршрутов</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
