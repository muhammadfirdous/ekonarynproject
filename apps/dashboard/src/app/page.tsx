'use client';

import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { formatMoney, formatWeight, formatDate, statusColors, statusLabels } from '@/lib/utils';
import { Package, Truck, Users, DollarSign, ClipboardList, Scale, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface Overview {
  totalCollections: number;
  totalWeightKg: number;
  totalRevenue: number;
  activeWorkers: number;
  totalResidents: number;
  pendingRequests: number;
}

interface Request {
  id: string;
  address: string;
  status: string;
  estimatedQty: number;
  createdAt: string;
  resident: { name: string };
  material: { nameRu: string };
}

interface MonthlyData {
  month: string;
  weight: number;
}

interface MaterialData {
  name: string;
  weight: number;
}

const CHART_COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7'];

// Simple sparkline for weight card
const weeklyData = [
  { day: 'Пн', value: 42 },
  { day: 'Вт', value: 38 },
  { day: 'Ср', value: 55 },
  { day: 'Чт', value: 47 },
  { day: 'Пт', value: 63 },
  { day: 'Сб', value: 51 },
  { day: 'Вс', value: 35 },
];

// Mock data for charts (would come from API in production)
const monthlyChartData = [
  { month: 'Янв', weight: 320 },
  { month: 'Фев', weight: 450 },
  { month: 'Мар', weight: 380 },
  { month: 'Апр', weight: 520 },
  { month: 'Май', weight: 610 },
  { month: 'Июн', weight: 480 },
  { month: 'Июл', weight: 550 },
];

const materialsChartData = [
  { name: 'ПЭТ пластик', value: 45 },
  { name: 'HDPE пластик', value: 20 },
  { name: 'Картон', value: 25 },
  { name: 'Бумага', value: 10 },
];

export default function OverviewPage() {
  const { data: overview, loading } = useApi<Overview>('/analytics/overview');
  const { data: requests } = useApi<Request[]>('/requests?limit=5');

  return (
    <DashboardLayout>
      <PageHeader title="Обзор" description="Панель управления Эко Нарын" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-28 animate-pulse border border-neutral-100" />
          ))}
        </div>
      ) : overview ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <StatsCard title="Всего сборов" value={overview.totalCollections} icon={Package} trend={{ value: 12, label: 'vs прошлый мес.' }} />
            <StatsCard title="Общий вес" value={formatWeight(overview.totalWeightKg)} icon={Scale} />
            <StatsCard title="Общая выручка" value={formatMoney(overview.totalRevenue)} icon={DollarSign} variant="accent" />
            <StatsCard title="Работников" value={overview.activeWorkers} icon={Users} />
            <StatsCard title="Жителей" value={overview.totalResidents} icon={Users} />
            <StatsCard title="Ожидающие заявки" value={overview.pendingRequests} icon={ClipboardList} />
          </div>

          {/* Latest applications card */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-card mb-8">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-neutral-900">Последние заявки</h2>
              <Link href="/requests" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
                Все заявки
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {requests && requests.length > 0 ? (
                requests.map((req) => (
                  <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-700">{req.resident?.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{req.resident?.name}</p>
                        <p className="text-[13px] text-neutral-500 mt-0.5">
                          {req.material?.nameRu} · {req.estimatedQty} кг · {req.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[req.status])}>
                        {statusLabels[req.status]}
                      </span>
                      <p className="text-[13px] text-neutral-400 mt-1">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-neutral-500 text-sm">Нет заявок</div>
              )}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar chart - Collections this month */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">Сборы по месяцам</h3>
              <p className="text-[13px] text-neutral-500 mb-5">Вес собранных материалов (кг)</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`${value} кг`, 'Вес']}
                    />
                    <Bar dataKey="weight" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut chart - Materials breakdown */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">Распределение материалов</h3>
              <p className="text-[13px] text-neutral-500 mb-5">Процентное соотношение по типу</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialsChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {materialsChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Доля']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span style={{ color: '#374151', fontSize: '13px' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
