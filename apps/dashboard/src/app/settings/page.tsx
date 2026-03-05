'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/users/${user?.id}`, form, token!);
      setMessage('Настройки сохранены');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Настройки" description="Настройки аккаунта и системы" />

      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-eco-text mb-4">Профиль администратора</h3>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{message}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Имя</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">Телефон</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>

        <div className="bg-white rounded-card border border-gray-100 shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-eco-text mb-4">Информация о системе</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-eco-gray">Версия</span>
              <span className="text-eco-text font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-eco-gray">API</span>
              <span className="text-eco-text font-medium">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-eco-gray">Роль</span>
              <span className="text-eco-text font-medium">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
