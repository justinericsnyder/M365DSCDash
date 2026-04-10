import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

export async function GET() {
  try {
    const ctx = await resolveTenantContext();

    if (!ctx.tenantId) {
      return NextResponse.json({
        hasTenant: false,
        isAuthenticated: ctx.isAuthenticated,
        isDemoMode: ctx.isDemoMode,
      });
    }

    const cacheKey = `m365:dashboard:${ctx.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const tenant = await prisma.m365Tenant.findUnique({
      where: { id: ctx.tenantId },
      include: { snapshots: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    if (!tenant) return NextResponse.json({ hasTenant: false });

    const workloadStats = await prisma.m365Resource.groupBy({
      by: ["workload"],
      where: { tenantId: ctx.tenantId },
      _count: true,
    });

    const workloadCompliance = await prisma.m365Resource.groupBy({
      by: ["workload", "status"],
      where: { tenantId: ctx.tenantId },
      _count: true,
    });

    const workloads: Record<string, { total: number; compliant: number; drifted: number }> = {};
    for (const ws of workloadStats) {
      workloads[ws.workload] = { total: ws._count, compliant: 0, drifted: 0 };
    }
    for (const wc of workloadCompliance) {
      if (!workloads[wc.workload]) continue;
      if (wc.status === "COMPLIANT") workloads[wc.workload].compliant = wc._count;
      else workloads[wc.workload].drifted += wc._count;
    }

    const totalResources = await prisma.m365Resource.count({ where: { tenantId: ctx.tenantId } });
    const compliantResources = await prisma.m365Resource.count({ where: { tenantId: ctx.tenantId, status: "COMPLIANT" } });
    const driftedResources = await prisma.m365Resource.findMany({
      where: { tenantId: ctx.tenantId, status: { not: "COMPLIANT" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const resourceTypes = await prisma.m365Resource.groupBy({
      by: ["resourceType"],
      where: { tenantId: ctx.tenantId },
      _count: true,
    });

    const stats = {
      hasTenant: true,
      isDemoMode: ctx.isDemoMode,
      tenant: {
        id: tenant.id, tenantId: tenant.tenantId, displayName: tenant.displayName,
        tenantName: tenant.tenantName, defaultDomain: tenant.defaultDomain,
        lastExport: tenant.lastExport, lastDriftCheck: tenant.lastDriftCheck,
      },
      latestSnapshot: tenant.snapshots[0] || null,
      totals: {
        resources: totalResources, compliant: compliantResources,
        drifted: totalResources - compliantResources,
        complianceRate: totalResources > 0 ? Math.round((compliantResources / totalResources) * 100) : 0,
      },
      workloads, driftedResources,
      resourceTypes: resourceTypes.map((rt) => ({ type: rt.resourceType, count: rt._count })),
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("M365 dashboard error:", error);
    return NextResponse.json({ error: "Failed to load M365 dashboard" }, { status: 500 });
  }
}
