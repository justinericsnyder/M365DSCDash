import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

export async function GET() {
  try {
    const ctx = await resolveTenantContext();
    if (!ctx.tenantId) return NextResponse.json({ hasTenant: false, hasAgents: false, isAuthenticated: ctx.isAuthenticated });

    const cacheKey = `agents:dashboard:${ctx.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const total = await prisma.agent365.count({ where: { tenantId: ctx.tenantId } });
    if (total === 0) return NextResponse.json({ hasTenant: true, hasAgents: false });

    const [byType, blocked, deployed, pinned, withRisks, ownerless, withEmbeddedFiles, recentAgents] = await Promise.all([
      prisma.agent365.groupBy({ by: ["type"], where: { tenantId: ctx.tenantId }, _count: true }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, isBlocked: true } }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, deployedTo: { not: "none" } } }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, isPinned: true } }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, riskCount: { gt: 0 } } }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, isOwnerless: true } }),
      prisma.agent365.count({ where: { tenantId: ctx.tenantId, hasEmbeddedFiles: true } }),
      prisma.agent365.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { lastModifiedDateTime: "desc" }, take: 10 }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t.type] = t._count;
    const totalRisks = await prisma.agent365.aggregate({ where: { tenantId: ctx.tenantId, riskCount: { gt: 0 } }, _sum: { riskCount: true } });

    const stats = {
      hasTenant: true, hasAgents: true, isDemoMode: ctx.isDemoMode,
      tenant: { displayName: "", tenantName: "" },
      totals: { total, microsoft: typeMap.MICROSOFT || 0, external: typeMap.EXTERNAL || 0, custom: typeMap.CUSTOM || 0, shared: typeMap.SHARED || 0, blocked, deployed, pinned, withRisks, totalRiskCount: totalRisks._sum.riskCount || 0, ownerless, withEmbeddedFiles },
      recentAgents,
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Agents dashboard error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
