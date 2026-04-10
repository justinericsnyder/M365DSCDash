import { getCurrentUser } from "./auth";
import { prisma } from "./db";

// Demo user ID used for seed data — unauthenticated users see this
const DEMO_USER_ID = "demo-user-001";

export interface TenantContext {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  userId: string;
  tenantId: string | null; // DB id of M365Tenant, null if no tenant
}

/**
 * Resolves which tenant's data to show:
 * - Authenticated user with connected tenant → their tenant's live data
 * - Authenticated user without tenant → no data (prompt to connect)
 * - Unauthenticated → demo data only
 */
export async function resolveTenantContext(): Promise<TenantContext> {
  const user = await getCurrentUser();

  if (!user) {
    // Unauthenticated: show demo data
    const demoTenant = await prisma.m365Tenant.findFirst({
      where: { userId: DEMO_USER_ID },
      select: { id: true },
    });
    return {
      isAuthenticated: false,
      isDemoMode: true,
      userId: DEMO_USER_ID,
      tenantId: demoTenant?.id || null,
    };
  }

  // Authenticated: find their connected tenant
  const tenant = await prisma.m365Tenant.findFirst({
    where: { userId: user.id },
    select: { id: true, isConnected: true },
  });

  if (tenant?.isConnected) {
    return {
      isAuthenticated: true,
      isDemoMode: false,
      userId: user.id,
      tenantId: tenant.id,
    };
  }

  // Authenticated but no connected tenant — show nothing (not demo data)
  return {
    isAuthenticated: true,
    isDemoMode: false,
    userId: user.id,
    tenantId: null,
  };
}

/**
 * For infrastructure data (nodes, configs, drift) which is user-scoped
 */
export async function resolveInfraContext(): Promise<{ userId: string; isDemoMode: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    return { userId: DEMO_USER_ID, isDemoMode: true };
  }
  return { userId: user.id, isDemoMode: false };
}
