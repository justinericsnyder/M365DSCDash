import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "agents:dashboard";
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const tenant = await prisma.m365Tenant.findFirst();
    if (!tenant) return NextResponse.json({ hasTenant: false });

    const total = await prisma.agent365.count({ where: { tenantId: tenant.id } });
    if (total === 0) return NextResponse.json({ hasTenant: true, hasAgents: false });

    const [
      byType,
      blocked,
      deployed,
      pinned,
      withRisks,
      ownerless,
      withEmbeddedFiles,
      recentAgents,
    ] = await Promise.all([
      prisma.agent365.groupBy({ by: ["type"], where: { tenantId: tenant.id }, _count: true }),
      prisma.agent365.count({ where: { tenantId: tenant.id, isBlocked: true } }),
      prisma.agent365.count({ where: { tenantId: tenant.id, deployedTo: { not: "none" } } }),
      prisma.agent365.count({ where: { tenantId: tenant.id, isPinned: true } }),
      prisma.agent365.count({ where: { tenantId: tenant.id, riskCount: { gt: 0 } } }),
      prisma.agent365.count({ where: { tenantId: tenant.id, isOwnerless: true } }),
      prisma.agent365.count({ where: { tenantId: tenant.id, hasEmbeddedFiles: true } }),
      prisma.agent365.findMany({
        where: { tenantId: tenant.id },
        orderBy: { lastModifiedDateTime: "desc" },
        take: 10,
      }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t.type] = t._count;

    const totalRisks = await prisma.agent365.aggregate({
      where: { tenantId: tenant.id, riskCount: { gt: 0 } },
      _sum: { riskCount: true },
    });

    const stats = {
      hasTenant: true,
      hasAgents: true,
      tenant: { displayName: tenant.displayName, tenantName: tenant.tenantName },
      totals: {
        total,
        microsoft: typeMap.MICROSOFT || 0,
        external: typeMap.EXTERNAL || 0,
        custom: typeMap.CUSTOM || 0,
        shared: typeMap.SHARED || 0,
        blocked,
        deployed,
        pinned,
        withRisks,
        totalRiskCount: totalRisks._sum.riskCount || 0,
        ownerless,
        withEmbeddedFiles,
      },
      recentAgents,
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Agents dashboard error:", error);
    return NextResponse.json({ error: "Failed to load agents dashboard" }, { status: 500 });
  }
}
