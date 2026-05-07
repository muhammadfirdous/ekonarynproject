'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function SettingsPage() {
  const t = useT();
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
      setMessage(t('settings.saved'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">{t('settings.profileTitle')}</h3>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{message}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">{t('settings.name')}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">{t('settings.phone')}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-2.5 rounded-lg disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mt-6">
          <h3 className="font-semibold text-neutral-900 mb-4">{t('settings.systemTitle')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('settings.version')}</span>
              <span className="text-neutral-900 font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('settings.api')}</span>
              <span className="text-neutral-900 font-medium">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('settings.role')}</span>
              <span className="text-neutral-900 font-medium">{t(`roles.${user?.role || 'ADMIN'}`)}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
