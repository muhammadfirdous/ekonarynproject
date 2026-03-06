'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'accent';
  className?: string;
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }: StatsCardProps) {
  const isAccent = variant === 'accent';

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-200 hover:-translate-y-[2px]',
        isAccent
          ? 'bg-gradient-to-br from-brand-900 to-brand-700 text-white shadow-lg shadow-brand-900/20 hover:shadow-xl hover:shadow-brand-900/25'
          : 'bg-white border border-neutral-100 shadow-card hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-[13px] font-medium uppercase tracking-wide',
            isAccent ? 'text-brand-200' : 'text-neutral-500',
          )}>
            {title}
          </p>
          <p className={cn(
            'text-[32px] font-bold mt-1 leading-tight',
            isAccent ? 'text-white' : 'text-neutral-900',
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn('text-sm mt-1', isAccent ? 'text-brand-200' : 'text-neutral-500')}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-sm mt-1.5 font-medium',
              isAccent
                ? 'text-brand-200'
                : trend.value >= 0 ? 'text-brand-600' : 'text-red-600',
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          isAccent ? 'bg-white/20' : 'bg-brand-50',
        )}>
          <Icon className={cn('h-6 w-6', isAccent ? 'text-white' : 'text-brand-700')} />
        </div>
      </div>
    </div>
  );
}
