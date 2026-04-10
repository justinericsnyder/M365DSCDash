import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";
import { resolveInfraContext, resolveTenantContext } from "@/lib/tenant-resolver";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const infraCtx = await resolveInfraContext();
    const tenantCtx = await resolveTenantContext();
    const { searchParams } = new URL(req.url);
    const resolved = searchParams.get("resolved");
    const severity = searchParams.get("severity");
    const source = searchParams.get("source"); // "infra", "m365", "purview", or null for all

    const cacheKey = `drift:unified:${infraCtx.userId}:${tenantCtx.tenantId}:${resolved || "all"}:${severity || "all"}:${source || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const results: any[] = [];

    // Infrastructure drift events
    if (!source || source === "infra") {
      const infraWhere: Record<string, unknown> = { userId: infraCtx.userId };
      if (resolved !== null && resolved !== "") infraWhere.resolved = resolved === "true";
      if (severity) infraWhere.severity = severity;

      const infraDrift = await prisma.driftEvent.findMany({
        where: infraWhere,
        include: {
          node: { select: { id: true, name: true, hostname: true, platform: true } },
          resourceInstance: { select: { id: true, name: true, resourceType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const e of infraDrift) {
        results.push({
          id: e.id, source: "infra", severity: e.severity,
          resolved: e.resolved, resolvedAt: e.resolvedAt, createdAt: e.createdAt,
          targetName: e.node?.name || "Unknown Node",
          targetType: "node", targetId: e.node?.id,
          resourceName: e.resourceInstance?.name, resourceType: e.resourceInstance?.resourceType,
          differingProperties: e.differingProperties,
          desiredState: e.desiredState, actualState: e.actualState,
          hostname: e.node?.hostname, platform: e.node?.platform,
        });
      }
    }

    // M365 DSC drifted resources (resources with status != COMPLIANT)
    if ((!source || source === "m365") && tenantCtx.tenantId) {
      const m365Where: Record<string, unknown> = { tenantId: tenantCtx.tenantId, status: { not: "COMPLIANT" } };

      const m365Drifted = await prisma.m365Resource.findMany({
        where: m365Where,
        orderBy: { updatedAt: "desc" },
        take: 50,
      });

      for (const r of m365Drifted) {
        // Map M365 drift to a severity based on workload
        const sev = r.workload === "AAD" ? "HIGH" : r.workload === "DEFENDER" ? "MEDIUM" : "MEDIUM";
        if (severity && severity !== sev) continue;
        if (resolved === "true") continue; // M365 drifts are always "unresolved" until next sync
        if (resolved === "false" || resolved === null || resolved === "") {
          results.push({
            id: r.id, source: "m365", severity: sev,
            resolved: false, resolvedAt: null, createdAt: r.updatedAt,
            targetName: r.displayName, targetType: "m365resource", targetId: r.id,
            resourceName: r.displayName, resourceType: r.resourceType,
            differingProperties: r.differingProperties,
            desiredState: r.desiredState, actualState: r.actualState,
            workload: r.workload,
          });
        }
      }
    }

    // Purview label drift events
    if ((!source || source === "purview") && tenantCtx.tenantId) {
      const purviewWhere: Record<string, unknown> = { tenantId: tenantCtx.tenantId };
      if (resolved !== null && resolved !== "") purviewWhere.resolved = resolved === "true";
      if (severity) purviewWhere.severity = severity;

      const purviewDrift = await prisma.purviewLabelDrift.findMany({
        where: purviewWhere,
        include: { label: { select: { displayName: true, name: true, color: true } } },
        orderBy: { detectedAt: "desc" },
        take: 50,
      });

      for (const d of purviewDrift) {
        results.push({
          id: d.id, source: "purview", severity: d.severity,
          resolved: d.resolved, resolvedAt: d.resolvedAt, createdAt: d.detectedAt,
          targetName: d.label?.displayName || "Unknown Label",
          targetType: "label", targetId: d.labelId,
          resourceName: d.label?.displayName, resourceType: "SensitivityLabel",
          differingProperties: [d.field],
          desiredState: { [d.field]: d.previousValue },
          actualState: { [d.field]: d.currentValue },
          driftType: d.driftType, labelColor: d.label?.color,
        });
      }
    }

    // Sort all by date
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    await cacheSet(cacheKey, results, 15);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Drift GET error:", error);
    return NextResponse.json({ error: "Failed to load drift events" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, resolved, source } = body;

    if (source === "purview") {
      await prisma.purviewLabelDrift.update({
        where: { id },
        data: { resolved, resolvedAt: resolved ? new Date() : null },
      });
    } else {
      await prisma.driftEvent.update({
        where: { id },
        data: { resolved, resolvedAt: resolved ? new Date() : null },
      });
    }

    await cacheInvalidate("drift:*");
    await cacheInvalidate("dashboard:*");
    await cacheInvalidate("purview:*");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Drift PATCH error:", error);
    return NextResponse.json({ error: "Failed to update drift event" }, { status: 500 });
  }
}
