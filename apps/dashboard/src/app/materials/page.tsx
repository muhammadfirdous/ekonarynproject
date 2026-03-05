'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  nameKy: string;
  nameRu: string;
  buyingPrice: number;
  sellingPrice: number;
  unit: string;
  description: string | null;
}

const emptyForm = { name: '', nameKy: '', nameRu: '', buyingPrice: '', sellingPrice: '', unit: 'kg', description: '' };

export default function MaterialsPage() {
  const { token } = useAuth();
  const { data, loading, refetch } = useApi<Material[]>('/materials');
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const startEdit = (m: Material) => {
    setEditing(m.id);
    setForm({
      name: m.name, nameKy: m.nameKy, nameRu: m.nameRu,
      buyingPrice: String(m.buyingPrice), sellingPrice: String(m.sellingPrice),
      unit: m.unit, description: m.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name, nameKy: form.nameKy, nameRu: form.nameRu,
        buyingPrice: parseFloat(form.buyingPrice), sellingPrice: parseFloat(form.sellingPrice),
        unit: form.unit, description: form.description || undefined,
      };
      if (editing) {
        await api.put(`/materials/${editing}`, body, token!);
      } else {
        await api.post('/materials', body, token!);
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот материал?')) return;
    try {
      await api.delete(`/materials/${id}`, token!);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Материалы"
        description="Управление ценами и материалами"
        action={
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light">
            <Plus className="h-4 w-4" /> Добавить
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name (EN)</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Название (KY)</label>
              <input value={form.nameKy} onChange={(e) => setForm((f) => ({ ...f, nameKy: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Название (RU)</label>
              <input value={form.nameRu} onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Единица</label>
              <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Цена закупки (сом/{form.unit})</label>
              <input type="number" step="0.5" min="0" value={form.buyingPrice} onChange={(e) => setForm((f) => ({ ...f, buyingPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Цена продажи (сом/{form.unit})</label>
              <input type="number" step="0.5" min="0" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">Описание</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" rows={2} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50">{saving ? 'Сохранение...' : editing ? 'Обновить' : 'Создать'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2 border border-gray-200 rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-card p-6 h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map((m) => (
            <div key={m.id} className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-eco-text">{m.nameRu}</h3>
                  <p className="text-sm text-eco-gray">{m.nameKy} · {m.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(m)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="h-4 w-4 text-eco-gray" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4 text-red-400" /></button>
                </div>
              </div>
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-xs text-eco-gray">Закупка</p>
                  <p className="font-semibold text-eco-text">{m.buyingPrice} сом/{m.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-eco-gray">Продажа</p>
                  <p className="font-semibold text-green-600">{m.sellingPrice} сом/{m.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-eco-gray">Маржа</p>
                  <p className="font-semibold text-primary">{m.sellingPrice - m.buyingPrice} сом/{m.unit}</p>
                </div>
              </div>
              {m.description && <p className="mt-3 text-sm text-eco-gray">{m.description}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
