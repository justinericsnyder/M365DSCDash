import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

export async function GET() {
  try {
    const ctx = await resolveTenantContext();
    if (!ctx.tenantId) return NextResponse.json({ hasTenant: false, hasData: false, isAuthenticated: ctx.isAuthenticated });

    const cacheKey = `purview:dashboard:${ctx.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const totalLabels = await prisma.purviewSensitivityLabel.count({ where: { tenantId: ctx.tenantId } });
    if (totalLabels === 0) return NextResponse.json({ hasTenant: true, hasData: false });

    const [parentLabels, enabledLabels, protectedLabels, endpointProtected, defaultLabel, totalScopes, blockedScopes, inlineScopes, offlineScopes, unresolvedDrifts, criticalDrifts, highDrifts, allLabels, recentDrifts, scopes] = await Promise.all([
      prisma.purviewSensitivityLabel.count({ where: { tenantId: ctx.tenantId, parentLabelId: null } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: ctx.tenantId, isEnabled: true } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: ctx.tenantId, hasProtection: true } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: ctx.tenantId, isEndpointProtectionEnabled: true } }),
      prisma.purviewSensitivityLabel.findFirst({ where: { tenantId: ctx.tenantId, isDefault: true } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: ctx.tenantId } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: ctx.tenantId, restrictionAction: "block" } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: ctx.tenantId, executionMode: "evaluateInline" } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: ctx.tenantId, executionMode: "evaluateOffline" } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: ctx.tenantId, resolved: false } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: ctx.tenantId, resolved: false, severity: "CRITICAL" } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: ctx.tenantId, resolved: false, severity: "HIGH" } }),
      prisma.purviewSensitivityLabel.findMany({ where: { tenantId: ctx.tenantId, parentLabelId: null }, include: { sublabels: { orderBy: { priority: "asc" } }, _count: { select: { driftEvents: true } } }, orderBy: { priority: "asc" } }),
      prisma.purviewLabelDrift.findMany({ where: { tenantId: ctx.tenantId }, include: { label: { select: { displayName: true, name: true, color: true, parentLabelId: true } } }, orderBy: { detectedAt: "desc" }, take: 20 }),
      prisma.purviewProtectionScope.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: "desc" } }),
    ]);

    const stats = {
      hasTenant: true, hasData: true, isDemoMode: ctx.isDemoMode,
      tenant: { displayName: "", tenantName: "" },
      labels: { total: totalLabels, parents: parentLabels, sublabels: totalLabels - parentLabels, enabled: enabledLabels, disabled: totalLabels - enabledLabels, withProtection: protectedLabels, withEndpointProtection: endpointProtected, defaultLabel: defaultLabel ? { displayName: defaultLabel.displayName, name: defaultLabel.name } : null },
      protectionScopes: { total: totalScopes, blocked: blockedScopes, inline: inlineScopes, offline: offlineScopes },
      drift: { unresolved: unresolvedDrifts, critical: criticalDrifts, high: highDrifts },
      labelHierarchy: allLabels, recentDrifts, scopes,
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Purview dashboard error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
