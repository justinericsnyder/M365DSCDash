import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveInfraContext } from "@/lib/tenant-resolver";

export async function GET() {
  try {
    const ctx = await resolveInfraContext();
    const cacheKey = `dashboard:stats:${ctx.userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where = { userId: ctx.userId };

    const [totalNodes, compliantNodes, driftedNodes, errorNodes, totalConfigs, activeConfigs, totalResources, compliantResources, recentDrift, unresolvedDrift] = await Promise.all([
      prisma.node.count({ where }),
      prisma.node.count({ where: { ...where, status: "COMPLIANT" } }),
      prisma.node.count({ where: { ...where, status: "DRIFTED" } }),
      prisma.node.count({ where: { ...where, status: "ERROR" } }),
      prisma.configuration.count({ where }),
      prisma.configuration.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.resourceInstance.count({ where: { configuration: { userId: ctx.userId } } }),
      prisma.resourceInstance.count({ where: { configuration: { userId: ctx.userId }, inDesiredState: true } }),
      prisma.driftEvent.findMany({ where: { userId: ctx.userId }, take: 10, orderBy: { createdAt: "desc" }, include: { node: { select: { name: true, hostname: true } } } }),
      prisma.driftEvent.count({ where: { userId: ctx.userId, resolved: false } }),
    ]);

    const complianceRate = totalNodes > 0 ? Math.round((compliantNodes / totalNodes) * 100) : 0;
    const resourceCompliance = totalResources > 0 ? Math.round((compliantResources / totalResources) * 100) : 0;

    const stats = {
      isDemoMode: ctx.isDemoMode,
      nodes: { total: totalNodes, compliant: compliantNodes, drifted: driftedNodes, error: errorNodes },
      configurations: { total: totalConfigs, active: activeConfigs },
      resources: { total: totalResources, compliant: compliantResources, complianceRate: resourceCompliance },
      compliance: { rate: complianceRate },
      drift: { unresolved: unresolvedDrift, recent: recentDrift },
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
