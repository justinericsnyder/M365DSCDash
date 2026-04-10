import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveInfraContext, resolveTenantContext } from "@/lib/tenant-resolver";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const infraCtx = await resolveInfraContext();
    const tenantCtx = await resolveTenantContext();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const compliant = searchParams.get("compliant");
    const source = searchParams.get("source"); // "infra", "m365", "purview", or null for all

    const cacheKey = `resources:unified:${infraCtx.userId}:${tenantCtx.tenantId}:${type || "all"}:${compliant || "all"}:${source || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const results: any[] = [];

    // Infrastructure DSC resources
    if (!source || source === "infra") {
      const infraWhere: Record<string, unknown> = { configuration: { userId: infraCtx.userId } };
      if (type) infraWhere.resourceType = { contains: type, mode: "insensitive" };
      if (compliant !== null && compliant !== "") infraWhere.inDesiredState = compliant === "true";

      const infraResources = await prisma.resourceInstance.findMany({
        where: infraWhere,
        include: { configuration: { select: { id: true, name: true, status: true } }, _count: { select: { driftEvents: true } } },
        orderBy: { updatedAt: "desc" },
      });

      for (const r of infraResources) {
        results.push({
          id: r.id, source: "infra", name: r.name, resourceType: r.resourceType,
          status: r.inDesiredState ? "COMPLIANT" : "DRIFTED",
          parentName: r.configuration.name, parentId: r.configuration.id,
          parentType: "configuration", driftCount: r._count.driftEvents,
          lastChecked: r.updatedAt, properties: r.properties,
        });
      }
    }

    // M365 DSC resources
    if ((!source || source === "m365") && tenantCtx.tenantId) {
      const m365Where: Record<string, unknown> = { tenantId: tenantCtx.tenantId };
      if (type) m365Where.resourceType = { contains: type, mode: "insensitive" };
      if (compliant === "true") m365Where.status = "COMPLIANT";
      if (compliant === "false") m365Where.status = { not: "COMPLIANT" };

      const m365Resources = await prisma.m365Resource.findMany({
        where: m365Where,
        orderBy: [{ workload: "asc" }, { resourceType: "asc" }],
      });

      for (const r of m365Resources) {
        results.push({
          id: r.id, source: "m365", name: r.displayName, resourceType: r.resourceType,
          status: r.status, workload: r.workload,
          parentName: r.workload, parentId: null,
          parentType: "workload", driftCount: r.differingProperties.length > 0 ? 1 : 0,
          lastChecked: r.lastChecked, properties: r.properties,
        });
      }
    }

    // Purview sensitivity labels as resources
    if ((!source || source === "purview") && tenantCtx.tenantId) {
      const purviewLabels = await prisma.purviewSensitivityLabel.findMany({
        where: { tenantId: tenantCtx.tenantId },
        include: { _count: { select: { driftEvents: true } } },
        orderBy: { priority: "asc" },
      });

      for (const l of purviewLabels) {
        if (type && !l.name.toLowerCase().includes(type.toLowerCase()) && !("SensitivityLabel").toLowerCase().includes(type.toLowerCase())) continue;
        const hasDrift = l._count.driftEvents > 0;
        if (compliant === "true" && hasDrift) continue;
        if (compliant === "false" && !hasDrift) continue;

        results.push({
          id: l.id, source: "purview", name: l.displayName, resourceType: "SensitivityLabel",
          status: l.isEnabled && !hasDrift ? "COMPLIANT" : !l.isEnabled ? "DISABLED" : "DRIFTED",
          workload: "Purview", color: l.color, priority: l.priority,
          parentName: "Purview", parentId: null,
          parentType: "purview", driftCount: l._count.driftEvents,
          lastChecked: l.updatedAt, properties: { color: l.color, priority: l.priority, isEnabled: l.isEnabled, hasProtection: l.hasProtection, applicableTo: l.applicableTo },
        });
      }
    }

    await cacheSet(cacheKey, results, 15);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Resources GET error:", error);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}
