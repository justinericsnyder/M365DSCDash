import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "dashboard:stats";
    const cached = await cacheGet<DashboardStats>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const [
      totalNodes,
      compliantNodes,
      driftedNodes,
      errorNodes,
      totalConfigs,
      activeConfigs,
      totalResources,
      compliantResources,
      recentDrift,
      unresolvedDrift,
    ] = await Promise.all([
      prisma.node.count(),
      prisma.node.count({ where: { status: "COMPLIANT" } }),
      prisma.node.count({ where: { status: "DRIFTED" } }),
      prisma.node.count({ where: { status: "ERROR" } }),
      prisma.configuration.count(),
      prisma.configuration.count({ where: { status: "ACTIVE" } }),
      prisma.resourceInstance.count(),
      prisma.resourceInstance.count({ where: { inDesiredState: true } }),
      prisma.driftEvent.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { node: { select: { name: true, hostname: true } } },
      }),
      prisma.driftEvent.count({ where: { resolved: false } }),
    ]);

    const complianceRate = totalNodes > 0 ? Math.round((compliantNodes / totalNodes) * 100) : 0;
    const resourceCompliance = totalResources > 0 ? Math.round((compliantResources / totalResources) * 100) : 0;

    const stats: DashboardStats = {
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
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

interface DashboardStats {
  nodes: { total: number; compliant: number; drifted: number; error: number };
  configurations: { total: number; active: number };
  resources: { total: number; compliant: number; complianceRate: number };
  compliance: { rate: number };
  drift: { unresolved: number; recent: unknown[] };
}
