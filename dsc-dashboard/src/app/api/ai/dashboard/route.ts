import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const ctx = await resolveTenantContext();
    if (!ctx.tenantId) return NextResponse.json({ hasData: false });

    const cacheKey = `ai:dashboard:${ctx.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Get all AI-related resources
    const aiTypes = ["CopilotLimitedMode", "CopilotGraphConnector", "CopilotServicePrincipal", "CopilotTeamsApp", "CopilotOAuthConsent", "CopilotPinnedAgent", "PowerPlatformAISettings"];
    const aiResources = await prisma.m365Resource.findMany({
      where: { tenantId: ctx.tenantId, resourceType: { in: aiTypes } },
      orderBy: [{ resourceType: "asc" }, { displayName: "asc" }],
    });

    // Get agents
    const agents = await prisma.agent365.findMany({ where: { tenantId: ctx.tenantId } });

    // Get secure score
    const secureScore = await prisma.m365Resource.findFirst({
      where: { tenantId: ctx.tenantId, resourceType: "SecureScore" },
    });

    // Get secure score controls
    const scoreControls = await prisma.m365Resource.findMany({
      where: { tenantId: ctx.tenantId, resourceType: "SecureScoreControlProfile" },
      orderBy: { displayName: "asc" },
    });

    // Group AI resources by type
    const byType: Record<string, any[]> = {};
    for (const r of aiResources) {
      if (!byType[r.resourceType]) byType[r.resourceType] = [];
      byType[r.resourceType].push(r);
    }

    // Compute metrics
    const connectors = byType.CopilotGraphConnector || [];
    const servicePrincipals = byType.CopilotServicePrincipal || [];
    const teamsApps = byType.CopilotTeamsApp || [];
    const oauthConsents = byType.CopilotOAuthConsent || [];
    const enabledSPs = servicePrincipals.filter((sp: any) => (sp.properties as any)?.AccountEnabled === true);
    const disabledSPs = servicePrincipals.filter((sp: any) => (sp.properties as any)?.AccountEnabled === false);
    const readyConnectors = connectors.filter((c: any) => c.status === "COMPLIANT");

    // Agent metrics
    const agentsByType: Record<string, number> = {};
    for (const a of agents) { agentsByType[a.type] = (agentsByType[a.type] || 0) + 1; }
    const deployedAgents = agents.filter((a) => a.deployedTo !== "none");
    const blockedAgents = agents.filter((a) => a.isBlocked);
    const riskyAgents = agents.filter((a) => a.riskCount > 0);
    const pinnedAgents = agents.filter((a) => a.isPinned);

    // Security data
    const securityAlerts = await prisma.m365Resource.findMany({
      where: { tenantId: ctx.tenantId, resourceType: "SecurityAlert" },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const securityIncidents = await prisma.m365Resource.findMany({
      where: { tenantId: ctx.tenantId, resourceType: "SecurityIncident" },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Alert severity breakdown
    const alertsBySeverity: Record<string, number> = {};
    for (const a of securityAlerts) {
      const sev = String((a.properties as any)?.Severity || "unknown");
      alertsBySeverity[sev] = (alertsBySeverity[sev] || 0) + 1;
    }
    const activeAlerts = securityAlerts.filter((a) => a.status !== "COMPLIANT");
    const activeIncidents = securityIncidents.filter((i) => i.status !== "COMPLIANT");

    const stats = {
      hasData: aiResources.length > 0 || agents.length > 0 || securityAlerts.length > 0,
      isDemoMode: ctx.isDemoMode,
      totals: {
        aiResources: aiResources.length,
        connectors: connectors.length,
        readyConnectors: readyConnectors.length,
        servicePrincipals: servicePrincipals.length,
        enabledSPs: enabledSPs.length,
        disabledSPs: disabledSPs.length,
        teamsApps: teamsApps.length,
        oauthConsents: oauthConsents.length,
        agents: agents.length,
        deployedAgents: deployedAgents.length,
        blockedAgents: blockedAgents.length,
        riskyAgents: riskyAgents.length,
        pinnedAgents: pinnedAgents.length,
        agentsByType,
        securityAlerts: securityAlerts.length,
        activeAlerts: activeAlerts.length,
        securityIncidents: securityIncidents.length,
        activeIncidents: activeIncidents.length,
        alertsBySeverity,
      },
      secureScore: secureScore ? secureScore.properties : null,
      scoreControls: scoreControls.map((c) => ({ displayName: c.displayName, properties: c.properties, status: c.status })),
      resources: byType,
      agents: agents.slice(0, 20),
      securityAlerts,
      securityIncidents,
    };

    await cacheSet(cacheKey, stats, 30);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("AI dashboard error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
