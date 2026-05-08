import { OrderStatus } from '@ekonaryn/shared';
import { AppError } from '../middleware/error';

// Authoritative transition table for the pickup-request lifecycle.
// pending → accepted → assigned → in_progress → completed | cancelled | rejected | failed
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.ACCEPTED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.ASSIGNED]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
    OrderStatus.FAILED,
  ],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.FAILED]: [],
};

const ALL_STATUSES = new Set<string>(Object.values(OrderStatus));

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && ALL_STATUSES.has(value);
}

export function canTransition(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
}

export function allowedNextStates(from: string): OrderStatus[] {
  return isOrderStatus(from) ? [...TRANSITIONS[from]] : [];
}

export function assertTransition(from: string, to: string): void {
  if (!isOrderStatus(to)) {
    throw new AppError(`Unknown order status: ${to}`, 400);
  }
  if (!isOrderStatus(from)) {
    throw new AppError(`Order is in unknown status: ${from}`, 400);
  }
  if (!canTransition(from, to)) {
    throw new AppError(
      `Illegal order transition: ${from} → ${to}. Allowed next: ${allowedNextStates(from).join(', ') || '(terminal)'}`,
      409,
    );
  }
}
