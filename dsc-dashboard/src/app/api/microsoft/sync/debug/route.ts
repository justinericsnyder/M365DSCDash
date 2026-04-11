import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, securityHeaders } from "@/lib/auth";
import { getAccessTokenForTenant, graphGet } from "@/lib/microsoft-graph";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Debug endpoint — tests each Graph API endpoint individually and reports results
export async function GET() {
  const headers = securityHeaders();
  try {
    const user = await requireAuth();
    const tenant = await prisma.m365Tenant.findFirst({ where: { userId: user.id, isConnected: true } });

    if (!tenant) {
      return NextResponse.json({ error: "No connected tenant" }, { status: 400, headers });
    }

    let accessToken: string;
    try {
      accessToken = await getAccessTokenForTenant(tenant.id);
    } catch (err) {
      return NextResponse.json({ error: `Token failed: ${err instanceof Error ? err.message : err}` }, { status: 401, headers });
    }

    // Test each endpoint
    const endpoints = [
      { name: "Organization", path: "/organization", beta: false },
      { name: "Me", path: "/me", beta: false },
      { name: "CA Policies", path: "/identity/conditionalAccess/policies", beta: false },
      { name: "Auth Methods", path: "/policies/authenticationMethodsPolicy", beta: false },
      { name: "Security Defaults", path: "/policies/identitySecurityDefaultsEnforcementPolicy", beta: false },
      { name: "Domains", path: "/domains", beta: false },
      { name: "Group Settings", path: "/groupSettings", beta: false },
      { name: "Directory Roles", path: "/directoryRoles", beta: false },
      { name: "SPO Settings", path: "/admin/sharepoint/settings", beta: true },
      { name: "Teams App Settings", path: "/teamwork/teamsAppSettings", beta: true },
      { name: "Joined Teams", path: "/me/joinedTeams", beta: false },
      { name: "Mailbox Settings", path: "/me/mailboxSettings", beta: false },
      { name: "My Drive", path: "/me/drive", beta: false },
      { name: "Sites", path: "/sites?search=*&$top=3", beta: false },
      { name: "Secure Scores", path: "/security/secureScores?$top=1", beta: false },
      { name: "Intune Compliance", path: "/deviceManagement/deviceCompliancePolicies", beta: true },
      { name: "Intune Config", path: "/deviceManagement/deviceConfigurations", beta: true },
      // Purview endpoints
      { name: "Purview Labels (v1.0 DSG)", path: "/security/dataSecurityAndGovernance/sensitivityLabels", beta: false },
      { name: "Purview Labels (beta InfoProt)", path: "/security/informationProtection/sensitivityLabels", beta: true },
      { name: "Purview Labels (beta user)", path: "/me/security/informationProtection/sensitivityLabels", beta: true },
      // Agent endpoints
      { name: "Copilot Packages", path: "/copilot/admin/catalog/packages", beta: true },
      { name: "Teams Apps (org)", path: "/appCatalogs/teamsApps?$filter=distributionMethod eq 'organization'", beta: false },
      // AI / Copilot endpoints
      { name: "Copilot Limited Mode", path: "/copilot/admin/settings/limitedMode", beta: false },
      { name: "Copilot Limited Mode (beta)", path: "/copilot/admin/settings/limitedMode", beta: true },
      { name: "Graph Connectors", path: "/external/connections", beta: false },
      { name: "Copilot Service Principals", path: "/servicePrincipals?$filter=startswith(displayName,'Microsoft Copilot')&$top=5", beta: false },
      { name: "Teams App Catalog", path: "/appCatalogs/teamsApps?$top=5", beta: false },
      { name: "OAuth2 Grants (AI)", path: "/oauth2PermissionGrants?$top=5", beta: false },
      { name: "Teams App Settings", path: "/teamwork/teamsAppSettings", beta: true },
      // Agent Identity APIs (Entra Agent ID)
      { name: "Agent Collections", path: "/agentRegistry/agentCollections", beta: true },
      { name: "Agent Instances", path: "/agentRegistry/agentInstances", beta: true },
      { name: "Agent Card Manifests", path: "/agentRegistry/agentCardManifests", beta: true },
      { name: "Agent Identities", path: "/agentIdentities", beta: true },
      { name: "Agent Identity Blueprints", path: "/agentIdentityBlueprints", beta: true },
    ];

    const results: Array<{ name: string; path: string; status: string; count?: number; error?: string }> = [];

    for (const ep of endpoints) {
      try {
        const base = ep.beta ? "https://graph.microsoft.com/beta" : "https://graph.microsoft.com/v1.0";
        const res = await fetch(`${base}${ep.path}`, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          const count = data.value ? data.value.length : (data.authenticationMethodConfigurations ? data.authenticationMethodConfigurations.length : undefined);
          results.push({ name: ep.name, path: ep.path, status: `${res.status} OK`, count });
        } else {
          const err = await res.json().catch(() => ({}));
          results.push({
            name: ep.name, path: ep.path,
            status: `${res.status} ${res.statusText}`,
            error: (err as any).error?.message || (err as any).error?.code || JSON.stringify(err).substring(0, 200),
          });
        }
      } catch (err) {
        results.push({ name: ep.name, path: ep.path, status: "EXCEPTION", error: err instanceof Error ? err.message : String(err) });
      }
    }

    const working = results.filter((r) => r.status.includes("OK")).length;
    const failed = results.filter((r) => !r.status.includes("OK")).length;

    return NextResponse.json({
      tenant: { id: tenant.id, displayName: tenant.displayName, tenantName: tenant.tenantName },
      scopes: tenant.tokenScopes,
      summary: { working, failed, total: results.length },
      results,
    }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500, headers });
  }
}
