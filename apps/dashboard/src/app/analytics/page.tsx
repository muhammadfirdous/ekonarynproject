'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { formatWeight } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useT, useLang } from '@/lib/i18n';

interface MonthlyData {
  [key: string]: { collections: number; weightKg: number; value: number };
}

interface MaterialData {
  material: { name: string; nameRu: string };
  totalWeightKg: number;
  totalCollections: number;
  estimatedValue: number;
}

interface WorkerData {
  worker: { name: string };
  totalCollections: number;
  totalWeightKg: number;
  totalTrips: number;
}

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#2E7D32'];

export default function AnalyticsPage() {
  const t = useT();
  const { lang } = useLang();
  const { data: monthly } = useApi<MonthlyData>('/analytics/monthly');
  const { data: materials } = useApi<MaterialData[]>('/analytics/materials');
  const { data: workers } = useApi<WorkerData[]>('/analytics/workers');

  const weightSeries = t('analytics.weightSeries');

  const monthlyChart = monthly
    ? Object.entries(monthly).map(([month, d]) => ({
        month,
        [weightSeries]: Math.round(d.weightKg),
      }))
    : [];

  const materialsPie = materials
    ? materials.map((m) => ({
        name: (lang === 'ru' ? m.material?.nameRu : m.material?.name) || 'Unknown',
        value: Math.round(m.totalWeightKg),
      }))
    : [];

  return (
    <DashboardLayout>
      <PageHeader title={t('analytics.title')} description={t('analytics.description')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly collections chart */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t('analytics.monthlyTitle')}</h3>
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={weightSeries} fill="#1B5E20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">{t('analytics.noData')}</div>
          )}
        </div>

        {/* Materials breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t('analytics.materialsTitle')}</h3>
          {materialsPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={materialsPie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {materialsPie.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      {/* Worker stats */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t('analytics.workersTitle')}</h3>
        {workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div key={w.worker.name} className="bg-brand-50 rounded-xl p-4">
                <p className="font-semibold text-neutral-900">{w.worker.name}</p>
                <div className="mt-2 space-y-1 text-sm text-neutral-500">
                  <p>{t('analytics.workerCollections')}: <span className="font-medium text-neutral-900">{w.totalCollections}</span></p>
                  <p>{t('analytics.workerCollected')}: <span className="font-medium text-neutral-900">{formatWeight(w.totalWeightKg)}</span></p>
                  <p>{t('analytics.workerTrips')}: <span className="font-medium text-neutral-900">{w.totalTrips}</span></p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-500">{t('analytics.noData')}</div>
        )}
      </div>
    </DashboardLayout>
  );
}
