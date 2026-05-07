'use client';

import { cn, statusColors } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function StatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status] || 'bg-neutral-100 text-neutral-700 border border-neutral-200',
      )}
    >
      {t(`status.${status}`) || status}
    </span>
  );
}
