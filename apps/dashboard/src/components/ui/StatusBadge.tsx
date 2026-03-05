import { cn } from '@/lib/utils';
import { statusColors, statusLabels } from '@/lib/utils';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[status] || 'bg-gray-100 text-gray-800')}>
      {statusLabels[status] || status}
    </span>
  );
}
