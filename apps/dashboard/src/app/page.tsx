'use client';

import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { useApi } from '@/lib/hooks';
import { formatMoney, formatWeight, formatDate, statusColors, statusLabels } from '@/lib/utils';
import { Package, Truck, Users, DollarSign, ClipboardList, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function OverviewPage() {
  const { data: overview, loading } = useApi<Overview>('/analytics/overview');
  const { data: requests } = useApi<Request[]>('/requests?limit=5');

  return (
    <DashboardLayout>
      <PageHeader title="Обзор" description="Панель управления Эко Нарын" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-card p-6 h-28 animate-pulse" />
          ))}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard title="Всего сборов" value={overview.totalCollections} icon={Package} />
            <StatsCard title="Общий вес" value={formatWeight(overview.totalWeightKg)} icon={Scale} />
            <StatsCard title="Общая выручка" value={formatMoney(overview.totalRevenue)} icon={DollarSign} />
            <StatsCard title="Работников" value={overview.activeWorkers} icon={Users} />
            <StatsCard title="Жителей" value={overview.totalResidents} icon={Users} />
            <StatsCard title="Ожидающие заявки" value={overview.pendingRequests} icon={ClipboardList} />
          </div>

          <div className="bg-white rounded-card border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-eco-text">Последние заявки</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {requests && requests.length > 0 ? (
                requests.map((req) => (
                  <div key={req.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-eco-text">{req.resident?.name}</p>
                      <p className="text-sm text-eco-gray">
                        {req.material?.nameRu} · {req.estimatedQty} кг · {req.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[req.status])}>
                        {statusLabels[req.status]}
                      </span>
                      <p className="text-xs text-eco-gray mt-1">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-eco-gray">Нет заявок</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
