import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, securityHeaders } from "@/lib/auth";
import { getAccessTokenForTenant, graphGet } from "@/lib/microsoft-graph";
import { cacheInvalidate } from "@/lib/redis";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SyncResult {
  success: boolean;
  count?: number;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// Try a Graph API call, return null on failure instead of throwing
async function tryGraphGet(token: string, endpoint: string, beta = false): Promise<{ data: any; error: null } | { data: null; error: string }> {
  try {
    const data = await graphGet(token, endpoint, beta);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Request failed" };
  }
}

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

    const results: Record<string, SyncResult> = {};

    // ─── 1. Sync Sensitivity Labels (Purview) ───────────
    // Try multiple endpoints in order of preference
    results.purviewLabels = await syncPurviewLabels(accessToken, tenant.id);

    // ─── 2. Sync Agent Registry (Copilot Packages) ─────
    results.agents = await syncAgentRegistry(accessToken, tenant.id);

    // ─── 3. Sync Organization Info ──────────────────────
    results.organization = await syncOrganization(accessToken, tenant.id, tenant.defaultDomain, tenant.displayName);

    // ─── 4. Sync User Profile ───────────────────────────
    results.profile = await syncUserProfile(accessToken, tenant.id);

    // Invalidate caches
    await cacheInvalidate("purview:*");
    await cacheInvalidate("agents:*");
    await cacheInvalidate("m365:*");
    await cacheInvalidate("dashboard:*");

    // Update last sync
    await prisma.m365Tenant.update({
      where: { id: tenant.id },
      data: { lastSyncAt: new Date(), lastExport: new Date(), lastDriftCheck: new Date(), connectionError: null },
    });

    const successCount = Object.values(results).filter((r) => r.success).length;
    const skippedCount = Object.values(results).filter((r) => r.skipped).length;
    const totalCount = Object.keys(results).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount}/${totalCount} sources${skippedCount > 0 ? ` (${skippedCount} unavailable on your license)` : ""}`,
      results,
    }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}

// ─── Purview Labels ─────────────────────────────────────
// Tries 3 endpoints in order:
// 1. v1.0 /security/dataSecurityAndGovernance/sensitivityLabels (E5/Purview)
// 2. beta /security/informationProtection/sensitivityLabels (E3+)
// 3. beta /me/security/informationProtection/sensitivityLabels (delegated, E3+)

async function syncPurviewLabels(token: string, tenantId: string): Promise<SyncResult> {
  const endpoints = [
    { path: "/security/dataSecurityAndGovernance/sensitivityLabels", beta: false, name: "v1.0 DSG" },
    { path: "/security/informationProtection/sensitivityLabels", beta: true, name: "beta InfoProtection" },
    { path: "/me/security/informationProtection/sensitivityLabels", beta: true, name: "beta user-scoped" },
  ];

  for (const ep of endpoints) {
    const res = await tryGraphGet(token, ep.path, ep.beta);
    if (res.data) {
      const labels = (res.data as any).value || [];
      if (labels.length === 0) continue; // try next endpoint

      // Clear existing
      await prisma.purviewLabelDrift.deleteMany({ where: { tenantId } });
      await prisma.purviewSensitivityLabel.deleteMany({ where: { tenantId } });

      let count = 0;
      for (const label of labels) {
        const created = await prisma.purviewSensitivityLabel.create({
          data: {
            tenantId,
            labelId: label.id,
            name: label.name || label.displayName || "Unknown",
            displayName: label.displayName || label.name || "Unknown",
            description: label.description || null,
            tooltip: label.toolTip || label.tooltip || null,
            color: label.color || null,
            priority: label.priority ?? count,
            sensitivity: label.sensitivity ?? 0,
            isEnabled: label.isEnabled ?? label.isActive ?? true,
            isDefault: label.isDefault ?? false,
            isEndpointProtectionEnabled: label.isEndpointProtectionEnabled ?? false,
            hasProtection: label.hasProtection ?? false,
            applicableTo: parseApplicableTo(label.applicableTo),
            contentFormats: label.contentFormats || [],
            applicationMode: label.applicationMode || "manual",
            actionSource: label.actionSource || "manual",
            isAppliable: label.isAppliable ?? true,
          },
        });
        count++;

        // Sublabels
        const subs = label.sublabels || label.children || [];
        if (Array.isArray(subs)) {
          for (const sub of subs) {
            await prisma.purviewSensitivityLabel.create({
              data: {
                tenantId,
                labelId: sub.id,
                name: sub.name || sub.displayName || "Unknown",
                displayName: sub.displayName || sub.name || "Unknown",
                description: sub.description || null,
                tooltip: sub.toolTip || sub.tooltip || null,
                color: sub.color || label.color || null,
                priority: sub.priority ?? count,
                sensitivity: sub.sensitivity ?? 0,
                isEnabled: sub.isEnabled ?? sub.isActive ?? true,
                isDefault: sub.isDefault ?? false,
                isEndpointProtectionEnabled: sub.isEndpointProtectionEnabled ?? false,
                hasProtection: sub.hasProtection ?? false,
                applicableTo: parseApplicableTo(sub.applicableTo),
                contentFormats: [],
                applicationMode: sub.applicationMode || "manual",
                isAppliable: true,
                parentLabelId: created.id,
              },
            });
            count++;
          }
        }
      }

      return { success: true, count };
    }
  }

  // All endpoints failed
  return {
    success: false,
    skipped: true,
    reason: "Requires Microsoft 365 E3/E5 or Microsoft Purview license",
    error: "Sensitivity labels API not available. This feature requires Microsoft Purview licensing (E3/E5). Your tenant data will use demo labels instead.",
  };
}

// ─── Agent Registry ─────────────────────────────────────
// Tries beta Copilot packages API — requires Copilot license

async function syncAgentRegistry(token: string, tenantId: string): Promise<SyncResult> {
  const endpoints = [
    { path: "/copilot/admin/catalog/packages", beta: true, name: "Copilot packages" },
    { path: "/appCatalogs/teamsApps?$filter=distributionMethod eq 'organization'", beta: false, name: "Teams apps fallback" },
  ];

  for (const ep of endpoints) {
    const res = await tryGraphGet(token, ep.path, ep.beta);
    if (res.data) {
      const items = (res.data as any).value || [];
      if (items.length === 0 && ep.name === "Copilot packages") continue;

      await prisma.agent365.deleteMany({ where: { tenantId } });

      let count = 0;
      for (const pkg of items) {
        await prisma.agent365.create({
          data: {
            tenantId,
            packageId: pkg.id,
            displayName: pkg.displayName || pkg.name || "Unnamed",
            type: mapAgentType(pkg.type || pkg.distributionMethod),
            shortDescription: pkg.shortDescription || pkg.description || null,
            publisher: pkg.publisher || pkg.publisherDisplayName || null,
            isBlocked: pkg.isBlocked ?? false,
            supportedHosts: pkg.supportedHosts || [],
            elementTypes: pkg.elementTypes || [],
            platform: pkg.platform || null,
            version: pkg.version || null,
            manifestVersion: pkg.manifestVersion || null,
            manifestId: pkg.manifestId || pkg.externalId || null,
            appId: pkg.appId || null,
            availableTo: pkg.availableTo || "none",
            deployedTo: pkg.deployedTo || "none",
            lastModifiedDateTime: pkg.lastModifiedDateTime ? new Date(pkg.lastModifiedDateTime) : null,
          },
        });
        count++;
      }

      return { success: true, count };
    }
  }

  return {
    success: false,
    skipped: true,
    reason: "Requires Microsoft 365 Copilot license or Frontier preview",
    error: "Agent Registry API not available. This requires a Copilot license. Your tenant data will use demo agents instead.",
  };
}

// ─── Organization Info ──────────────────────────────────

async function syncOrganization(token: string, tenantId: string, currentDomain: string, currentName: string): Promise<SyncResult> {
  const res = await tryGraphGet(token, "/organization");
  if (res.data) {
    const org = (res.data as any).value?.[0];
    if (org) {
      const defaultDomain = org.verifiedDomains?.find((d: any) => d.isDefault)?.name || currentDomain;
      await prisma.m365Tenant.update({
        where: { id: tenantId },
        data: {
          displayName: org.displayName || currentName,
          defaultDomain,
        },
      });
      return { success: true };
    }
  }
  return { success: false, error: res.error || "Could not fetch organization info" };
}

// ─── User Profile ───────────────────────────────────────

async function syncUserProfile(token: string, tenantId: string): Promise<SyncResult> {
  const res = await tryGraphGet(token, "/me?$select=displayName,mail,userPrincipalName,jobTitle,department");
  if (res.data) {
    const profile = res.data as any;
    await prisma.m365Tenant.update({
      where: { id: tenantId },
      data: {
        connectedUserEmail: profile.mail || profile.userPrincipalName || null,
      },
    });
    return { success: true };
  }
  return { success: false, error: res.error || "Could not fetch user profile" };
}

// ─── Helpers ────────────────────────────────────────────

function parseApplicableTo(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function mapAgentType(type: string | undefined): "MICROSOFT" | "EXTERNAL" | "CUSTOM" | "SHARED" {
  switch (type?.toLowerCase()) {
    case "microsoft": return "MICROSOFT";
    case "external": return "EXTERNAL";
    case "custom": return "CUSTOM";
    case "shared": return "SHARED";
    case "organization": return "CUSTOM";
    default: return "EXTERNAL";
  }
}
