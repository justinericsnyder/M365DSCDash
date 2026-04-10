import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, securityHeaders } from "@/lib/auth";
import { getAccessTokenForTenant, graphGet, graphPost } from "@/lib/microsoft-graph";
import { cacheInvalidate } from "@/lib/redis";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST() {
  const headers = securityHeaders();
  try {
    const user = await requireAuth();

    const tenant = await prisma.m365Tenant.findFirst({
      where: { userId: user.id, isConnected: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "No connected tenant. Go to Settings to connect Microsoft 365." }, { status: 400, headers });
    }

    let accessToken: string;
    try {
      accessToken = await getAccessTokenForTenant(tenant.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Token refresh failed";
      await prisma.m365Tenant.update({
        where: { id: tenant.id },
        data: { connectionError: msg },
      });
      return NextResponse.json({ error: `Authentication failed: ${msg}. Try reconnecting in Settings.` }, { status: 401, headers });
    }

    const results: Record<string, { success: boolean; count?: number; error?: string }> = {};

    // ─── 1. Sync Sensitivity Labels (Purview) ───────────
    try {
      const labelsRes = await graphGet(accessToken, "/security/dataSecurityAndGovernance/sensitivityLabels") as any;
      const labels = labelsRes.value || [];

      // Clear existing labels for this tenant
      await prisma.purviewLabelDrift.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.purviewSensitivityLabel.deleteMany({ where: { tenantId: tenant.id } });

      let labelCount = 0;
      for (const label of labels) {
        const created = await prisma.purviewSensitivityLabel.create({
          data: {
            tenantId: tenant.id,
            labelId: label.id,
            name: label.name || label.displayName,
            displayName: label.displayName || label.name,
            description: label.description || null,
            tooltip: label.toolTip || label.tooltip || null,
            color: label.color || null,
            priority: label.priority ?? 0,
            sensitivity: label.sensitivity ?? 0,
            isEnabled: label.isEnabled ?? true,
            isDefault: label.isDefault ?? false,
            isEndpointProtectionEnabled: label.isEndpointProtectionEnabled ?? false,
            hasProtection: label.hasProtection ?? false,
            applicableTo: label.applicableTo ? label.applicableTo.split(",").map((s: string) => s.trim()) : [],
            contentFormats: label.contentFormats || [],
            applicationMode: label.applicationMode || "manual",
            actionSource: label.actionSource || "manual",
            isAppliable: label.isAppliable ?? true,
          },
        });
        labelCount++;

        // Handle sublabels if present
        if (label.sublabels && Array.isArray(label.sublabels)) {
          for (const sub of label.sublabels) {
            await prisma.purviewSensitivityLabel.create({
              data: {
                tenantId: tenant.id,
                labelId: sub.id,
                name: sub.name || sub.displayName,
                displayName: sub.displayName || sub.name,
                description: sub.description || null,
                tooltip: sub.toolTip || sub.tooltip || null,
                color: sub.color || label.color || null,
                priority: sub.priority ?? 0,
                sensitivity: sub.sensitivity ?? 0,
                isEnabled: sub.isEnabled ?? true,
                isDefault: sub.isDefault ?? false,
                isEndpointProtectionEnabled: sub.isEndpointProtectionEnabled ?? false,
                hasProtection: sub.hasProtection ?? false,
                applicableTo: sub.applicableTo ? sub.applicableTo.split(",").map((s: string) => s.trim()) : [],
                contentFormats: [],
                applicationMode: sub.applicationMode || "manual",
                isAppliable: true,
                parentLabelId: created.id,
              },
            });
            labelCount++;
          }
        }
      }

      results.purviewLabels = { success: true, count: labelCount };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      results.purviewLabels = { success: false, error: msg };
    }

    // ─── 2. Sync Agent Registry (Copilot Packages) ─────
    try {
      // This is a beta API — requires CopilotPackages.Read.All
      const packagesRes = await graphGet(accessToken, "/copilot/admin/catalog/packages", true) as any;
      const packages = packagesRes.value || [];

      // Clear existing agents for this tenant
      await prisma.agent365.deleteMany({ where: { tenantId: tenant.id } });

      let agentCount = 0;
      for (const pkg of packages) {
        await prisma.agent365.create({
          data: {
            tenantId: tenant.id,
            packageId: pkg.id,
            displayName: pkg.displayName || "Unnamed Agent",
            type: mapAgentType(pkg.type),
            shortDescription: pkg.shortDescription || null,
            publisher: pkg.publisher || null,
            isBlocked: pkg.isBlocked ?? false,
            supportedHosts: pkg.supportedHosts || [],
            elementTypes: pkg.elementTypes || [],
            platform: pkg.platform || null,
            version: pkg.version || null,
            manifestVersion: pkg.manifestVersion || null,
            manifestId: pkg.manifestId || null,
            appId: pkg.appId || null,
            availableTo: pkg.availableTo || "none",
            deployedTo: pkg.deployedTo || "none",
            lastModifiedDateTime: pkg.lastModifiedDateTime ? new Date(pkg.lastModifiedDateTime) : null,
          },
        });
        agentCount++;
      }

      results.agents = { success: true, count: agentCount };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      // Agent API requires specific permissions — not a hard failure
      results.agents = { success: false, error: msg };
    }

    // ─── 3. Sync Organization Info ──────────────────────
    try {
      const orgRes = await graphGet(accessToken, "/organization") as any;
      const org = orgRes.value?.[0];
      if (org) {
        const defaultDomain = org.verifiedDomains?.find((d: any) => d.isDefault)?.name || tenant.defaultDomain;
        await prisma.m365Tenant.update({
          where: { id: tenant.id },
          data: {
            displayName: org.displayName || tenant.displayName,
            defaultDomain,
            lastSyncAt: new Date(),
            connectionError: null,
          },
        });
      }
      results.organization = { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      results.organization = { success: false, error: msg };
    }

    // Invalidate caches
    await cacheInvalidate("purview:*");
    await cacheInvalidate("agents:*");
    await cacheInvalidate("m365:*");

    // Update last sync
    await prisma.m365Tenant.update({
      where: { id: tenant.id },
      data: { lastSyncAt: new Date(), lastExport: new Date(), lastDriftCheck: new Date() },
    });

    const successCount = Object.values(results).filter((r) => r.success).length;
    const totalCount = Object.keys(results).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount}/${totalCount} data sources`,
      results,
    }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}

function mapAgentType(type: string | undefined): "MICROSOFT" | "EXTERNAL" | "CUSTOM" | "SHARED" {
  switch (type?.toLowerCase()) {
    case "microsoft": return "MICROSOFT";
    case "external": return "EXTERNAL";
    case "custom": return "CUSTOM";
    case "shared": return "SHARED";
    default: return "EXTERNAL";
  }
}
