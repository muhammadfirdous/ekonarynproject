import { cn } from '@/lib/utils';
import { statusColors, statusLabels } from '@/lib/utils';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusColors[status] || 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
