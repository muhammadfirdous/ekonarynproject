import type { Request } from 'express';
import { prisma } from '@ekonaryn/db';

export interface LogContext {
  actorId?: string | null;
  actorRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function contextFromRequest(req?: Request): LogContext {
  if (!req) return {};
  const headerIp =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;
  return {
    actorId: req.user?.userId ?? null,
    actorRole: req.user?.role ?? null,
    ipAddress: headerIp,
    userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
  };
}

/**
 * Append a row to the activity log. Failures are swallowed so logging never
 * breaks the request that triggered it.
 */
export async function logActivity(
  reqOrCtx: Request | LogContext | undefined,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const ctx: LogContext =
    reqOrCtx && 'headers' in (reqOrCtx as Request)
      ? contextFromRequest(reqOrCtx as Request)
      : ((reqOrCtx as LogContext) ?? {});
  try {
    await prisma.activityLog.create({
      data: {
        actorId: ctx.actorId ?? null,
        actorRole: ctx.actorRole ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  } catch (err) {
    // Never let an audit-log write break the caller — log to stderr and move on.
    console.error('activityLog: failed to write entry', err);
  }
}
