import { prisma } from "./db";
import type { AuditAction } from "@prisma/client";

interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  success?: boolean;
}

/**
 * Write an append-only audit log entry.
 * Fire-and-forget — never blocks the request or throws.
 */
export function writeAuditLog(entry: AuditEntry): void {
  prisma.auditLog
    .create({
      data: {
        action: entry.action,
        userId: entry.userId ?? null,
        email: entry.email ?? null,
        ipAddress: entry.ipAddress?.substring(0, 45) ?? null,
        userAgent: entry.userAgent?.substring(0, 256) ?? null,
        details: entry.details?.substring(0, 1000) ?? null,
        success: entry.success ?? true,
      },
    })
    .catch(() => {
      // Best effort — don't let audit failures break auth flows
    });
}

/** Extract client IP from request headers */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
