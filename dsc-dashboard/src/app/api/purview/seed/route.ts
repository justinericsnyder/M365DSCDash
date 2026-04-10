import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoSensitivityLabels, demoProtectionScopes, demoLabelDrifts } from "@/lib/purview-demo-data";

export async function POST() {
  try {
    await prisma.purviewLabelDrift.deleteMany({});
    await prisma.purviewProtectionScope.deleteMany({});
    await prisma.purviewSensitivityLabel.deleteMany({});

    const tenant = await prisma.m365Tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "No M365 tenant found. Seed M365 data first." }, { status: 400 });
    }

    // Create labels (parents first, then sublabels)
    let labelCount = 0;
    const labelDbIds: Record<string, string> = {};

    for (const label of demoSensitivityLabels) {
      const created = await prisma.purviewSensitivityLabel.create({
        data: {
          tenantId: tenant.id,
          labelId: label.labelId,
          name: label.name,
          displayName: label.displayName,
          description: label.description,
          tooltip: label.tooltip,
          color: label.color,
          priority: label.priority,
          sensitivity: label.sensitivity,
          isEnabled: label.isEnabled,
          isDefault: label.isDefault || false,
          isEndpointProtectionEnabled: label.isEndpointProtectionEnabled || false,
          hasProtection: label.hasProtection || false,
          applicableTo: label.applicableTo,
          contentFormats: label.contentFormats || [],
          applicationMode: label.applicationMode || "manual",
          actionSource: label.actionSource || "manual",
          isAppliable: label.isAppliable ?? true,
        },
      });
      labelDbIds[label.labelId] = created.id;
      labelCount++;

      // Create sublabels
      if ("sublabels" in label && label.sublabels) {
        for (const sub of label.sublabels as any[]) {
          const subCreated = await prisma.purviewSensitivityLabel.create({
            data: {
              tenantId: tenant.id,
              labelId: sub.labelId,
              name: sub.name,
              displayName: sub.displayName,
              description: sub.description,
              tooltip: sub.tooltip || null,
              color: sub.color || label.color,
              priority: sub.priority,
              sensitivity: sub.sensitivity,
              isEnabled: sub.isEnabled,
              isDefault: sub.isDefault || false,
              isEndpointProtectionEnabled: sub.isEndpointProtectionEnabled || false,
              hasProtection: sub.hasProtection || false,
              applicableTo: sub.applicableTo,
              contentFormats: [],
              applicationMode: sub.applicationMode || "manual",
              isAppliable: true,
              parentLabelId: created.id,
            },
          });
          labelDbIds[sub.labelId] = subCreated.id;
          labelCount++;
        }
      }
    }

    // Create protection scopes
    let scopeCount = 0;
    for (const scope of demoProtectionScopes) {
      await prisma.purviewProtectionScope.create({
        data: {
          tenantId: tenant.id,
          userId: scope.userId,
          userDisplayName: scope.userDisplayName,
          activities: scope.activities,
          executionMode: scope.executionMode,
          locationType: scope.locationType || null,
          locationValue: scope.locationValue || null,
          policyActions: scope.policyActions as object,
          restrictionAction: scope.restrictionAction || null,
        },
      });
      scopeCount++;
    }

    // Create drift events
    let driftCount = 0;
    for (const drift of demoLabelDrifts) {
      const dbLabelId = labelDbIds[drift.labelId];
      if (!dbLabelId) continue;
      await prisma.purviewLabelDrift.create({
        data: {
          tenantId: tenant.id,
          labelId: dbLabelId,
          driftType: drift.driftType,
          field: drift.field,
          previousValue: drift.previousValue,
          currentValue: drift.currentValue,
          severity: drift.severity,
          resolved: drift.resolved,
          resolvedAt: drift.resolved ? new Date(Date.now() - (drift.hoursAgo - 1) * 3600000) : null,
          detectedAt: new Date(Date.now() - drift.hoursAgo * 3600000),
        },
      });
      driftCount++;
    }

    return NextResponse.json({
      success: true,
      message: "Purview demo data seeded",
      summary: { labels: labelCount, protectionScopes: scopeCount, driftEvents: driftCount },
    });
  } catch (error) {
    console.error("Purview seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
