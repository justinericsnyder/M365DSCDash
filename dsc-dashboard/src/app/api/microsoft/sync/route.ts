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

    // ─── 1. Sync M365 DSC via Graph APIs ────────────────
    results.m365Dsc = await syncM365DscViaGraph(accessToken, tenant.id);

    // ─── 2. Sync Sensitivity Labels (Purview) ───────────
    results.purviewLabels = await syncPurviewLabels(accessToken, tenant.id);

    // ─── 3. Sync Agent Registry (Copilot Packages) ─────
    results.agents = await syncAgentRegistry(accessToken, tenant.id);

    // ─── 4. Sync Organization Info ──────────────────────
    results.organization = await syncOrganization(accessToken, tenant.id, tenant.defaultDomain, tenant.displayName);

    // ─── 5. Sync User Profile ───────────────────────────
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

// ─── M365 DSC via Graph APIs ────────────────────────────
// Pulls tenant configuration data that maps to M365DSC workloads
// using native Graph API endpoints (no PowerShell needed)

async function syncM365DscViaGraph(token: string, tenantId: string): Promise<SyncResult> {
  const resources: Array<{
    workload: string;
    resourceType: string;
    displayName: string;
    properties: Record<string, unknown>;
    status: "COMPLIANT" | "DRIFTED";
    differingProperties: string[];
  }> = [];

  // ─── AAD: Conditional Access Policies ─────────────────
  const caPolicies = await tryGraphGet(token, "/identity/conditionalAccess/policies");
  if (caPolicies.data) {
    for (const p of ((caPolicies.data as any).value || [])) {
      const isDrifted = p.state !== "enabled";
      resources.push({
        workload: "AAD", resourceType: "AADConditionalAccessPolicy",
        displayName: p.displayName || "Unnamed Policy",
        properties: { DisplayName: p.displayName, State: p.state, Conditions: p.conditions, GrantControls: p.grantControls, SessionControls: p.sessionControls, CreatedDateTime: p.createdDateTime, ModifiedDateTime: p.modifiedDateTime },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["State"] : [],
      });
    }
  }

  // ─── AAD: Authentication Methods Policy ───────────────
  const authMethods = await tryGraphGet(token, "/policies/authenticationMethodsPolicy");
  if (authMethods.data) {
    for (const m of ((authMethods.data as any).authenticationMethodConfigurations || [])) {
      const isDrifted = m.state !== "enabled";
      resources.push({
        workload: "AAD", resourceType: "AADAuthenticationMethodPolicy",
        displayName: m["@odata.type"]?.replace("#microsoft.graph.", "") || m.id || "Auth Method",
        properties: { Id: m.id, State: m.state, ...m },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["AuthMethodState"] : [],
      });
    }
  }

  // ─── AAD: Group Settings ──────────────────────────────
  const groupSettings = await tryGraphGet(token, "/groupSettings");
  if (groupSettings.data) {
    for (const gs of ((groupSettings.data as any).value || [])) {
      const values: Record<string, string> = {};
      for (const v of (gs.values || [])) values[v.name] = v.value;
      resources.push({
        workload: "AAD", resourceType: "AADGroupsSettings",
        displayName: gs.displayName || "Group Settings",
        properties: { TemplateId: gs.templateId, ...values },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── AAD: Authorization Policy ────────────────────────
  const authzPolicy = await tryGraphGet(token, "/policies/authorizationPolicy");
  if (authzPolicy.data) {
    const p = authzPolicy.data as any;
    resources.push({
      workload: "AAD", resourceType: "AADAuthorizationPolicy",
      displayName: "Authorization Policy",
      properties: { AllowInvitesFrom: p.allowInvitesFrom, AllowedToSignUpEmailBasedSubscriptions: p.allowedToSignUpEmailBasedSubscriptions, AllowEmailVerifiedUsersToJoinOrganization: p.allowEmailVerifiedUsersToJoinOrganization, BlockMsolPowerShell: p.blockMsolPowerShell, GuestUserRoleId: p.guestUserRoleId },
      status: p.blockMsolPowerShell ? "COMPLIANT" : "DRIFTED",
      differingProperties: p.blockMsolPowerShell ? [] : ["BlockMsolPowerShell"],
    });
  }

  // ─── AAD: Security Defaults ───────────────────────────
  const secDefaults = await tryGraphGet(token, "/policies/identitySecurityDefaultsEnforcementPolicy");
  if (secDefaults.data) {
    const sd = secDefaults.data as any;
    resources.push({
      workload: "AAD", resourceType: "AADSecurityDefaults",
      displayName: "Security Defaults",
      properties: { IsEnabled: sd.isEnabled, DisplayName: sd.displayName },
      status: sd.isEnabled ? "COMPLIANT" : "DRIFTED",
      differingProperties: sd.isEnabled ? [] : ["IsEnabled"],
    });
  }

  // ─── AAD: Named Locations ─────────────────────────────
  const namedLocations = await tryGraphGet(token, "/identity/conditionalAccess/namedLocations");
  if (namedLocations.data) {
    for (const loc of ((namedLocations.data as any).value || [])) {
      resources.push({
        workload: "AAD", resourceType: "AADNamedLocation",
        displayName: loc.displayName || "Named Location",
        properties: { DisplayName: loc.displayName, Type: loc["@odata.type"], IsTrusted: loc.isTrusted, CreatedDateTime: loc.createdDateTime, ...loc },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── AAD: Directory Roles ─────────────────────────────
  const dirRoles = await tryGraphGet(token, "/directoryRoles");
  if (dirRoles.data) {
    for (const role of ((dirRoles.data as any).value || [])) {
      resources.push({
        workload: "AAD", resourceType: "AADRoleDefinition",
        displayName: role.displayName || "Directory Role",
        properties: { DisplayName: role.displayName, Description: role.description, RoleTemplateId: role.roleTemplateId },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── AAD: Domains ─────────────────────────────────────
  const domains = await tryGraphGet(token, "/domains");
  if (domains.data) {
    for (const d of ((domains.data as any).value || [])) {
      resources.push({
        workload: "AAD", resourceType: "AADDomain",
        displayName: d.id,
        properties: { Id: d.id, IsDefault: d.isDefault, IsVerified: d.isVerified, IsAdminManaged: d.isAdminManaged, AuthenticationType: d.authenticationType, SupportedServices: d.supportedServices },
        status: d.isVerified ? "COMPLIANT" : "DRIFTED",
        differingProperties: d.isVerified ? [] : ["IsVerified"],
      });
    }
  }

  // ─── AAD: Cross-Tenant Access Settings ────────────────
  const crossTenant = await tryGraphGet(token, "/policies/crossTenantAccessPolicy");
  if (crossTenant.data) {
    const ct = crossTenant.data as any;
    resources.push({
      workload: "AAD", resourceType: "AADCrossTenantAccessPolicy",
      displayName: "Cross-Tenant Access Policy",
      properties: { AllowedCloudEndpoints: ct.allowedCloudEndpoints, IsServiceDefault: ct.isServiceDefault },
      status: "COMPLIANT", differingProperties: [],
    });
  }

  // ─── SharePoint: Tenant Settings ──────────────────────
  const spoSettings = await tryGraphGet(token, "/admin/sharepoint/settings", true);
  if (spoSettings.data) {
    const s = spoSettings.data as any;
    const isDrifted = s.sharingCapability !== "disabled" && s.sharingCapability !== "externalUserSharingOnly";
    resources.push({
      workload: "SPO", resourceType: "SPOTenantSettings",
      displayName: "SharePoint Tenant Settings",
      properties: { SharingCapability: s.sharingCapability, IsResharingByExternalUsersEnabled: s.isResharingByExternalUsersEnabled, IsCommentingOnSitePagesEnabled: s.isCommentingOnSitePagesEnabled, IsSiteCreationEnabled: s.isSiteCreationEnabled, IsSitePagesCreationEnabled: s.isSitePagesCreationEnabled, SharingDomainRestrictionMode: s.sharingDomainRestrictionMode },
      status: isDrifted ? "DRIFTED" : "COMPLIANT",
      differingProperties: isDrifted ? ["SharingCapability"] : [],
    });
  }

  // ─── Teams: App Settings ──────────────────────────────
  const teamsApps = await tryGraphGet(token, "/teamwork/teamsAppSettings", true);
  if (teamsApps.data) {
    const t = teamsApps.data as any;
    resources.push({
      workload: "TEAMS", resourceType: "TeamsAppSettings",
      displayName: "Teams App Settings",
      properties: { IsChatResourceSpecificConsentEnabled: t.isChatResourceSpecificConsentEnabled },
      status: "COMPLIANT", differingProperties: [],
    });
  }

  // ─── Intune: Device Compliance Policies ───────────────
  const compliancePolicies = await tryGraphGet(token, "/deviceManagement/deviceCompliancePolicies", true);
  if (compliancePolicies.data) {
    for (const p of ((compliancePolicies.data as any).value || [])) {
      resources.push({
        workload: "INTUNE", resourceType: "IntuneDeviceCompliancePolicy",
        displayName: p.displayName || "Compliance Policy",
        properties: { DisplayName: p.displayName, Description: p.description, CreatedDateTime: p.createdDateTime, LastModifiedDateTime: p.lastModifiedDateTime, Version: p.version },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── Intune: Device Configuration Policies ────────────
  const configPolicies = await tryGraphGet(token, "/deviceManagement/deviceConfigurations", true);
  if (configPolicies.data) {
    for (const p of ((configPolicies.data as any).value || [])) {
      resources.push({
        workload: "INTUNE", resourceType: "IntuneDeviceConfigurationPolicy",
        displayName: p.displayName || "Config Policy",
        properties: { DisplayName: p.displayName, Description: p.description, CreatedDateTime: p.createdDateTime, LastModifiedDateTime: p.lastModifiedDateTime, Version: p.version, Type: p["@odata.type"] },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── Intune: App Protection Policies ──────────────────
  const appProtection = await tryGraphGet(token, "/deviceAppManagement/managedAppPolicies", true);
  if (appProtection.data) {
    for (const p of ((appProtection.data as any).value || [])) {
      resources.push({
        workload: "INTUNE", resourceType: "IntuneAppProtectionPolicy",
        displayName: p.displayName || "App Protection Policy",
        properties: { DisplayName: p.displayName, Description: p.description, CreatedDateTime: p.createdDateTime, LastModifiedDateTime: p.lastModifiedDateTime, Version: p.version, Type: p["@odata.type"] },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── Security: Secure Score ───────────────────────────
  const secureScore = await tryGraphGet(token, "/security/secureScores?$top=1");
  if (secureScore.data) {
    const scores = (secureScore.data as any).value || [];
    if (scores.length > 0) {
      const s = scores[0];
      const isDrifted = s.currentScore < s.maxScore * 0.7;
      resources.push({
        workload: "DEFENDER", resourceType: "SecureScore",
        displayName: "Microsoft Secure Score",
        properties: { CurrentScore: s.currentScore, MaxScore: s.maxScore, AverageComparativeScore: s.averageComparativeScores, CreatedDateTime: s.createdDateTime, EnabledServices: s.enabledServices },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["CurrentScore"] : [],
      });
    }
  }

  // ─── Security: Secure Score Control Profiles ──────────
  const scoreProfiles = await tryGraphGet(token, "/security/secureScoreControlProfiles?$top=50");
  if (scoreProfiles.data) {
    for (const p of ((scoreProfiles.data as any).value || []).slice(0, 30)) {
      const isDrifted = (p.currentScore ?? 0) < (p.maxScore ?? 1);
      resources.push({
        workload: "DEFENDER", resourceType: "SecureScoreControlProfile",
        displayName: p.title || p.id || "Control",
        properties: { Title: p.title, MaxScore: p.maxScore, CurrentScore: p.currentScore, ControlCategory: p.controlCategory, Service: p.service, Tier: p.tier, UserImpact: p.userImpact, ImplementationCost: p.implementationCost, Threats: p.threats },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["CurrentScore"] : [],
      });
    }
  }

  // ─── Exchange: Mailbox Settings (current user) ────────
  const mailboxSettings = await tryGraphGet(token, "/me/mailboxSettings");
  if (mailboxSettings.data) {
    const ms = mailboxSettings.data as any;
    resources.push({
      workload: "EXO", resourceType: "EXOMailboxSettings",
      displayName: "Current User Mailbox Settings",
      properties: { TimeZone: ms.timeZone, DateFormat: ms.dateFormat, TimeFormat: ms.timeFormat, Language: ms.language, AutomaticRepliesSetting: ms.automaticRepliesSetting?.status, DelegateMeetingMessageDeliveryOptions: ms.delegateMeetingMessageDeliveryOptions },
      status: "COMPLIANT", differingProperties: [],
    });
  }

  // ─── OneDrive: Drive Settings ─────────────────────────
  const myDrive = await tryGraphGet(token, "/me/drive");
  if (myDrive.data) {
    const d = myDrive.data as any;
    const isDrifted = d.quota?.state !== "normal";
    resources.push({
      workload: "OD", resourceType: "ODSettings",
      displayName: "OneDrive — Current User",
      properties: { DriveType: d.driveType, QuotaTotal: d.quota?.total, QuotaUsed: d.quota?.used, QuotaRemaining: d.quota?.remaining, QuotaState: d.quota?.state, WebUrl: d.webUrl },
      status: isDrifted ? "DRIFTED" : "COMPLIANT",
      differingProperties: isDrifted ? ["QuotaState"] : [],
    });
  }

  // ─── OneDrive / SharePoint: Sites ─────────────────────
  const sites = await tryGraphGet(token, "/sites?search=*&$top=20");
  if (sites.data) {
    for (const s of ((sites.data as any).value || []).slice(0, 20)) {
      resources.push({
        workload: "SPO", resourceType: "SPOSite",
        displayName: s.displayName || s.name || s.webUrl || "Site",
        properties: { DisplayName: s.displayName, WebUrl: s.webUrl, IsPersonalSite: s.isPersonalSite, CreatedDateTime: s.createdDateTime, LastModifiedDateTime: s.lastModifiedDateTime, SiteId: s.id },
        status: "COMPLIANT", differingProperties: [],
      });
    }
  }

  // ─── Teams: Joined Teams ──────────────────────────────
  const teams = await tryGraphGet(token, "/me/joinedTeams");
  if (teams.data) {
    for (const t of ((teams.data as any).value || [])) {
      resources.push({
        workload: "TEAMS", resourceType: "TeamsTeam",
        displayName: t.displayName || "Team",
        properties: { DisplayName: t.displayName, Description: t.description, Visibility: t.visibility, IsArchived: t.isArchived, WebUrl: t.webUrl, TenantId: t.tenantId },
        status: t.isArchived ? "DRIFTED" : "COMPLIANT",
        differingProperties: t.isArchived ? ["IsArchived"] : [],
      });
    }
  }

  // ─── Teams: Team Settings (per team) ──────────────────
  const teamsForSettings = await tryGraphGet(token, "/me/joinedTeams?$select=id,displayName");
  if (teamsForSettings.data) {
    for (const t of ((teamsForSettings.data as any).value || []).slice(0, 10)) {
      const teamDetail = await tryGraphGet(token, `/teams/${t.id}`);
      if (teamDetail.data) {
        const td = teamDetail.data as any;
        resources.push({
          workload: "TEAMS", resourceType: "TeamsTeamSettings",
          displayName: `${td.displayName || t.displayName} — Settings`,
          properties: { DisplayName: td.displayName, MemberSettings: td.memberSettings, GuestSettings: td.guestSettings, MessagingSettings: td.messagingSettings, FunSettings: td.funSettings },
          status: "COMPLIANT", differingProperties: [],
        });
      }
    }
  }

  // ─── Teams: Channels (per team, top 5 teams) ──────────
  const teamsForChannels = await tryGraphGet(token, "/me/joinedTeams?$select=id,displayName&$top=5");
  if (teamsForChannels.data) {
    for (const t of ((teamsForChannels.data as any).value || [])) {
      const channels = await tryGraphGet(token, `/teams/${t.id}/channels`);
      if (channels.data) {
        for (const ch of ((channels.data as any).value || [])) {
          resources.push({
            workload: "TEAMS", resourceType: "TeamsChannel",
            displayName: `${t.displayName} / ${ch.displayName}`,
            properties: { TeamName: t.displayName, ChannelName: ch.displayName, MembershipType: ch.membershipType, WebUrl: ch.webUrl, Description: ch.description },
            status: "COMPLIANT", differingProperties: [],
          });
        }
      }
    }
  }

  // ─── Power Platform: Environments (beta) ──────────────
  const ppEnvironments = await tryGraphGet(token, "/admin/powerPlatform/environments", true);
  if (ppEnvironments.data) {
    for (const env of ((ppEnvironments.data as any).value || [])) {
      const isDrifted = env.state !== "Ready";
      resources.push({
        workload: "PP", resourceType: "PPEnvironment",
        displayName: env.displayName || env.name || "Environment",
        properties: { DisplayName: env.displayName, Name: env.name, Type: env.environmentType, State: env.state, Region: env.region, CreatedTime: env.createdTime, IsDefault: env.isDefault },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["EnvironmentState"] : [],
      });
    }
  }

  // ─── Fabric / Power BI: Capacities (beta) ─────────────
  const fabricCapacities = await tryGraphGet(token, "/admin/fabric/capacities", true);
  if (fabricCapacities.data) {
    for (const cap of ((fabricCapacities.data as any).value || [])) {
      const isDrifted = cap.state !== "Active";
      resources.push({
        workload: "FABRIC", resourceType: "FabricCapacity",
        displayName: cap.displayName || cap.name || "Capacity",
        properties: { DisplayName: cap.displayName, Sku: cap.sku, State: cap.state, Region: cap.region, Admins: cap.admins },
        status: isDrifted ? "DRIFTED" : "COMPLIANT",
        differingProperties: isDrifted ? ["CapacityState"] : [],
      });
    }
  }

  if (resources.length === 0) {
    return {
      success: false, skipped: true,
      reason: "No M365 configuration data accessible with current permissions",
      error: "Add the required API permissions and reconnect. See Settings for details.",
    };
  }

  // Clear existing and write new
  await prisma.m365Resource.deleteMany({ where: { tenantId } });

  const workloads = [...new Set(resources.map((r) => r.workload))];
  const compliantCount = resources.filter((r) => r.status === "COMPLIANT").length;

  const snapshot = await prisma.m365Snapshot.create({
    data: {
      tenantId, label: `Graph API Sync — ${new Date().toISOString().split("T")[0]}`,
      exportMode: "GraphAPI", workloads: workloads as any[],
      resourceCount: resources.length, compliantCount, driftedCount: resources.length - compliantCount,
    },
  });

  for (const res of resources) {
    await prisma.m365Resource.create({
      data: {
        tenantId, snapshotId: snapshot.id, workload: res.workload as any,
        resourceType: res.resourceType, displayName: res.displayName, primaryKey: res.displayName,
        properties: res.properties as object, desiredState: res.properties as object, actualState: res.properties as object,
        status: res.status, differingProperties: res.differingProperties, lastChecked: new Date(),
      },
    });
  }

  return { success: true, count: resources.length };
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

  let apiAccessible = false;

  for (const ep of endpoints) {
    const res = await tryGraphGet(token, ep.path, ep.beta);
    if (res.data) {
      apiAccessible = true;
      const labels = (res.data as any).value || [];

      if (labels.length === 0) {
        // API works but no labels — check next endpoint for more results
        continue;
      }

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

  // All endpoints either failed or returned empty
  if (apiAccessible) {
    return {
      success: true,
      count: 0,
      reason: "Purview API accessible but no published labels found. Newly published labels can take up to 24 hours to appear in the Graph API. Try syncing again later.",
    };
  }

  return {
    success: false,
    skipped: true,
    reason: "Requires Microsoft 365 E3/E5 or Microsoft Purview license",
    error: "Sensitivity labels API not available. This feature requires Microsoft Purview licensing (E3/E5).",
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
    reason: "Copilot Packages API requires AI Admin role + Frontier preview enrollment",
    error: "The Copilot Packages API requires the AI Admin role assigned to the connecting user AND enrollment in Microsoft's Frontier preview program. Without Frontier access, this API returns 403.",
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
