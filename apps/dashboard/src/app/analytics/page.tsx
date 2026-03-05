'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { formatWeight, formatMoney } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface MonthlyData {
  [key: string]: { collections: number; weightKg: number; value: number };
}

interface MaterialData {
  material: { nameRu: string };
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
  const { data: monthly } = useApi<MonthlyData>('/analytics/monthly');
  const { data: materials } = useApi<MaterialData[]>('/analytics/materials');
  const { data: workers } = useApi<WorkerData[]>('/analytics/workers');

  const monthlyChart = monthly
    ? Object.entries(monthly).map(([month, d]) => ({
        month,
        'Сборов': d.collections,
        'Вес (кг)': Math.round(d.weightKg),
        'Стоимость': Math.round(d.value),
      }))
    : [];

  const materialsPie = materials
    ? materials.map((m) => ({
        name: m.material?.nameRu || 'Unknown',
        value: Math.round(m.totalWeightKg),
      }))
    : [];

  return (
    <DashboardLayout>
      <PageHeader title="Аналитика" description="Статистика и графики" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly collections chart */}
        <div className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-eco-text mb-4">Объем по месяцам (кг)</h3>
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Вес (кг)" fill="#1B5E20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-eco-gray">Нет данных</div>
          )}
        </div>

        {/* Materials breakdown */}
        <div className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-eco-text mb-4">По материалам (кг)</h3>
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
            <div className="h-[300px] flex items-center justify-center text-eco-gray">Нет данных</div>
          )}
        </div>
      </div>

      {/* Worker stats */}
      <div className="bg-white rounded-card border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-eco-text mb-4">Статистика работников</h3>
        {workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div key={w.worker.name} className="bg-eco-light rounded-xl p-4">
                <p className="font-semibold text-eco-text">{w.worker.name}</p>
                <div className="mt-2 space-y-1 text-sm text-eco-gray">
                  <p>Сборов: <span className="font-medium text-eco-text">{w.totalCollections}</span></p>
                  <p>Собрано: <span className="font-medium text-eco-text">{formatWeight(w.totalWeightKg)}</span></p>
                  <p>Рейсов: <span className="font-medium text-eco-text">{w.totalTrips}</span></p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-eco-gray">Нет данных</div>
        )}
      </div>
    </DashboardLayout>
  );
}
