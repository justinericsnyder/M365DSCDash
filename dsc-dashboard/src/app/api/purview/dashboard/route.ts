import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "purview:dashboard";
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const tenant = await prisma.m365Tenant.findFirst();
    if (!tenant) return NextResponse.json({ hasTenant: false });

    const totalLabels = await prisma.purviewSensitivityLabel.count({ where: { tenantId: tenant.id } });
    if (totalLabels === 0) return NextResponse.json({ hasTenant: true, hasData: false });

    const [
      parentLabels,
      enabledLabels,
      protectedLabels,
      endpointProtected,
      defaultLabel,
      totalScopes,
      blockedScopes,
      inlineScopes,
      offlineScopes,
      unresolvedDrifts,
      criticalDrifts,
      highDrifts,
      allLabels,
      recentDrifts,
      scopes,
    ] = await Promise.all([
      prisma.purviewSensitivityLabel.count({ where: { tenantId: tenant.id, parentLabelId: null } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: tenant.id, isEnabled: true } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: tenant.id, hasProtection: true } }),
      prisma.purviewSensitivityLabel.count({ where: { tenantId: tenant.id, isEndpointProtectionEnabled: true } }),
      prisma.purviewSensitivityLabel.findFirst({ where: { tenantId: tenant.id, isDefault: true } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: tenant.id } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: tenant.id, restrictionAction: "block" } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: tenant.id, executionMode: "evaluateInline" } }),
      prisma.purviewProtectionScope.count({ where: { tenantId: tenant.id, executionMode: "evaluateOffline" } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: tenant.id, resolved: false } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: tenant.id, resolved: false, severity: "CRITICAL" } }),
      prisma.purviewLabelDrift.count({ where: { tenantId: tenant.id, resolved: false, severity: "HIGH" } }),
      prisma.purviewSensitivityLabel.findMany({
        where: { tenantId: tenant.id, parentLabelId: null },
        include: { sublabels: { orderBy: { priority: "asc" } }, _count: { select: { driftEvents: true } } },
        orderBy: { priority: "asc" },
      }),
      prisma.purviewLabelDrift.findMany({
        where: { tenantId: tenant.id },
        include: { label: { select: { displayName: true, name: true, color: true, parentLabelId: true } } },
        orderBy: { detectedAt: "desc" },
        take: 20,
      }),
      prisma.purviewProtectionScope.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = {
      hasTenant: true,
      hasData: true,
      tenant: { displayName: tenant.displayName, tenantName: tenant.tenantName },
      labels: {
        total: totalLabels,
        parents: parentLabels,
        sublabels: totalLabels - parentLabels,
        enabled: enabledLabels,
        disabled: totalLabels - enabledLabels,
        withProtection: protectedLabels,
        withEndpointProtection: endpointProtected,
        defaultLabel: defaultLabel ? { displayName: defaultLabel.displayName, name: defaultLabel.name } : null,
      },
      protectionScopes: {
        total: totalScopes,
        blocked: blockedScopes,
        inline: inlineScopes,
        offline: offlineScopes,
      },
      drift: {
        unresolved: unresolvedDrifts,
        critical: criticalDrifts,
        high: highDrifts,
      },
      labelHierarchy: allLabels,
      recentDrifts,
      scopes,
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Purview dashboard error:", error);
    return NextResponse.json({ error: "Failed to load Purview dashboard" }, { status: 500 });
  }
}
