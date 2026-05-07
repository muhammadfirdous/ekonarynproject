'use client';

import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { formatMoney, formatWeight, formatDate, statusColors } from '@/lib/utils';
import { Package, Users, DollarSign, ClipboardList, Scale, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useT, useLocalized, useTArray } from '@/lib/i18n';
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
  material: { name: string; nameRu: string };
}

const CHART_COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7'];

function RequestRow({ req }: { req: Request }) {
  const t = useT();
  const matName = useLocalized(req.material, { ru: 'nameRu', en: 'name' });
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand-700">{req.resident?.name?.[0] || '?'}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">{req.resident?.name}</p>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            {matName} · {req.estimatedQty} {t('common.kg')} · {req.address}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[req.status])}>
          {t(`status.${req.status}`)}
        </span>
        <p className="text-[13px] text-neutral-400 mt-1">{formatDate(req.createdAt)}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const t = useT();
  const monthsShort = useTArray('overview.monthsShort');
  const { data: overview, loading } = useApi<Overview>('/analytics/overview');
  const { data: requests } = useApi<Request[]>('/requests?limit=5');

  // Mock data for charts
  const monthlyChartData = monthsShort.slice(0, 7).map((month, i) => ({
    month,
    weight: [320, 450, 380, 520, 610, 480, 550][i] ?? 0,
  }));

  const materialsChartData = [
    { name: t('overview.materialPet'), value: 45 },
    { name: t('overview.materialHdpe'), value: 20 },
    { name: t('overview.materialCardboard'), value: 25 },
    { name: t('overview.materialPaper'), value: 10 },
  ];

  return (
    <DashboardLayout>
      <PageHeader title={t('pageTitles./')} description={t('overview.description')} />

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
            <StatsCard title={t('overview.totalCollections')} value={overview.totalCollections} icon={Package} trend={{ value: 12, label: t('overview.trendVsLast') }} />
            <StatsCard title={t('overview.totalWeight')} value={formatWeight(overview.totalWeightKg)} icon={Scale} />
            <StatsCard title={t('overview.totalRevenue')} value={formatMoney(overview.totalRevenue)} icon={DollarSign} variant="accent" />
            <StatsCard title={t('overview.workers')} value={overview.activeWorkers} icon={Users} />
            <StatsCard title={t('overview.residents')} value={overview.totalResidents} icon={Users} />
            <StatsCard title={t('overview.pendingRequests')} value={overview.pendingRequests} icon={ClipboardList} />
          </div>

          {/* Latest applications card */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-card mb-8">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-neutral-900">{t('overview.latestRequests')}</h2>
              <Link href="/requests" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
                {t('overview.allRequests')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {requests && requests.length > 0 ? (
                requests.map((req) => <RequestRow key={req.id} req={req} />)
              ) : (
                <div className="px-6 py-12 text-center text-neutral-500 text-sm">{t('overview.noRequests')}</div>
              )}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar chart - Collections by month */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">{t('overview.monthlyTitle')}</h3>
              <p className="text-[13px] text-neutral-500 mb-5">{t('overview.monthlySub')}</p>
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
                      formatter={(value: number) => [`${value} ${t('common.kg')}`, t('overview.weightTooltip')]}
                    />
                    <Bar dataKey="weight" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut chart - Materials breakdown */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900 mb-1">{t('overview.materialsTitle')}</h3>
              <p className="text-[13px] text-neutral-500 mb-5">{t('overview.materialsSub')}</p>
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
                      formatter={(value: number) => [`${value}%`, t('overview.shareTooltip')]}
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
