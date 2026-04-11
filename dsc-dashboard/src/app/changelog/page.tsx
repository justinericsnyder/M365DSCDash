"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitCommit, Shield, Cloud, Bot, ShieldCheck, Search,
  Sparkles, Lock, TrendingUp, Zap, Database, Bug, Brain,
} from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "security" | "fix";
  title: string;
  description: string;
  details: string[];
  icon: React.ElementType;
  commitHash?: string;
}

const changelog: ChangelogEntry[] = [
  {
    version: "3.5.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Entra Agent ID APIs + UX Animations Across All Pages",
    description: "New Microsoft Entra Agent ID integration pulling agent identities, instances, collections, blueprints, and manifests. Plus skeleton loading states and gravity animations on every page.",
    icon: Sparkles,
    commitHash: "78c6448",
    details: [
      "Entra Agent ID sync: agent collections, instances, card manifests, identities, blueprints via 5 new beta Graph endpoints",
      "AI Governance: new KPI row showing Agent Identities, Instances, Collections, Manifests, Blueprints counts",
      "New scopes: AgentCollection.Read.All, AgentIdentity.Read.All, AgentIdentityBlueprint.Read.All, AgentInstance.Read.All, AgentCardManifest.Read.All",
      "Dashboard: skeleton loading state with layout placeholders, gravity-in animations, stagger-children on all grids",
      "M365 DSC: skeleton loading, workload card stagger animations",
      "Nodes: skeleton loading with 4 card placeholders, stagger on node list",
      "Purview, Agents, Drift, Resources, Configurations: stagger-children animations added",
    ],
  },
  {
    version: "3.4.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Azure AI Foundry + Copilot in Fabric Tabs with Live Data",
    description: "Both tabs rebuilt with live Secure Score data, animated radial dials, security controls, capability cards with sparklines, and capacity requirement visuals.",
    icon: Brain,
    commitHash: "d599123",
    details: [
      "Foundry: 4 KPI cards, Secure Score radial, AI-relevant controls grid, model deployment cards with sparklines, safety governance checklist",
      "Fabric: capability readiness cards with sparklines, admin config with status badges, capacity SKU radials (F64/P1/F128+)",
      "All sections use gravity-in and stagger-children animations",
    ],
  },
  {
    version: "3.3.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Live Security Tab — Alerts, Incidents, Score Controls",
    description: "Copilot for Security tab rebuilt with live data from Graph API security endpoints.",
    icon: ShieldCheck,
    commitHash: "4366935",
    details: [
      "Security KPI cards: Secure Score %, alerts, incidents, controls with sparklines",
      "Secure Score radial dial with animated 1s fill and enabled services pills",
      "Security Alerts list from GET /security/alerts_v2 with severity color coding",
      "Security Incidents list from GET /security/incidents with classification",
      "Security Controls grid with per-control progress bars",
      "Dark mode bulk fixes: badges, status dots, buttons, all bg-white/gray replaced",
    ],
  },
  {
    version: "3.2.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Dark Crimson-Mauve Theme + WCAG AA Accessibility",
    description: "Complete dark theme with deep crimson-mauve backgrounds, soft mauve-red accents, gravity animations, and WCAG AA contrast compliance.",
    icon: Sparkles,
    commitHash: "63cd4f4",
    details: [
      "Background: #1A0C12 (dark cherry), Surface: #2C1420 (warm burgundy), Border: #5A2438 (rose)",
      "Button primary: #8B3A5C (deep mauve-rose) with white text — high contrast",
      "Blue accent shifted to #B89ADA (soft lavender-mauve) for theme cohesion",
      "WCAG AA: primary text 12.4:1, secondary 6.2:1, all accents 4.5:1+ on surface",
      "Gravity animations: card-hover with spring bounce, gravity-in, fade-scale-in, slide-down, stagger-children",
      "Scrollbar, code editor, form inputs all themed",
    ],
  },
  {
    version: "3.1.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Connector Detail Modal + Reusable Modal Component",
    description: "Click any Graph connector in AI Governance to open a detailed modal with schema properties, metrics, and configuration.",
    icon: Sparkles,
    commitHash: "7a184e4",
    details: [
      "Connector modal: status banner, schema property radial, indexed items, connection details, activity/search settings",
      "Reusable Modal component: backdrop blur, escape key, click-outside, body scroll lock, wide variant",
      "Collapsible raw properties view",
    ],
  },
  {
    version: "3.0.0",
    date: "April 10, 2026",
    type: "feature",
    title: "AI Governance Hub — Full Copilot, Foundry, Fabric, Security Coverage",
    description: "New AI Governance page with 6 tabs covering the entire Microsoft AI ecosystem. Live data sync for Copilot settings, Graph connectors, service principals, Teams AI apps, and OAuth consents.",
    icon: Sparkles,
    commitHash: "a06c88e",
    details: [
      "Overview tab: metric cards with sparklines, agent donut chart, connector health grid, governance alerts, service principal status",
      "Copilot for M365 tab: admin settings, Graph connectors with schema counts, Teams AI apps, OAuth consent grants — all expandable",
      "Copilot Studio tab: agent types (declarative/custom engine/classic), 5 governance controls, portal links",
      "Azure AI Foundry tab: Secure Score radial dial, model deployment types (OpenAI/Foundry/Custom/Prompt Flow), 5 safety controls",
      "Copilot in Fabric tab: 4 capabilities (notebooks/Power BI/Data Factory/SQL), 4 admin settings with Purview label integration",
      "Copilot for Security tab: security controls with progress bars from Secure Score, 5 capabilities, 5 admin configs, SCU management",
      "New sync: Graph Connectors, Copilot Service Principals (6 filter queries), Teams AI apps, OAuth2 AI consents, Copilot Limited Mode",
      "New API: GET /api/ai/dashboard with aggregated AI metrics",
      "New scopes: ExternalConnection.Read.All, AppCatalog.Read.All",
    ],
  },
  {
    version: "2.7.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Expandable Resource Details Across All Pages",
    description: "Every resource on both the M365 Resources and unified Resources pages is now clickable to reveal a rich detail view with property grids, nested object breakdowns, and array pills.",
    icon: Sparkles,
    details: [
      "All M365 resources: click to expand a structured property grid with boolean indicators (✓/✗), string values, and nested objects",
      "Complex properties (Conditions, GrantControls, MemberSettings) rendered as nested key-value grids",
      "Array properties (SupportedServices, applicableTo) shown as colored pills",
      "Drifted properties highlighted in red with drift indicator banner",
      "Unified Resources page (/resources) also gets expandable items with the same detail view",
      "OneDrive and Secure Score retain their specialized radial dial views",
    ],
  },
  {
    version: "2.6.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Secure Score Radial Dial with Grade and Enabled Services",
    description: "Microsoft Secure Score resources now show a radial dial chart with letter grade, enabled services as colored pills, and posture guidance.",
    icon: ShieldCheck,
    commitHash: "3a52c56",
    details: [
      "Radial dial: current score / max score with color coding (green A, yellow B, red C/D)",
      "Letter grade (A/B/C/D) based on achievement percentage",
      "Three metric cards: Current Score, Max Score, Achievement %",
      "Enabled Services pills color-coded per service (Exchange, SharePoint, Teams, etc.)",
      "Comparative scores (industry averages) when available",
      "Guidance callout with link to security.microsoft.com/securescore",
    ],
  },
  {
    version: "2.5.0",
    date: "April 10, 2026",
    type: "feature",
    title: "OneDrive Storage Metrics with Radial Dial and Capacity Forecast",
    description: "OneDrive resources now show a radial dial chart for storage usage, GB metrics, and a forecast of when storage will be full.",
    icon: Cloud,
    commitHash: "4f17c3c",
    details: [
      "Radial dial chart: used % with green/yellow/red color coding",
      "Three metric cards: Total GB, Used GB, Remaining GB",
      "Linear usage bar with labels",
      "Forecast callout: estimates days/years until storage is full based on usage rate",
      "Color-coded quota state badge (normal/nearing/critical/exceeded)",
    ],
  },
  {
    version: "2.4.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Persistent Sync Status and API Endpoint Health in Settings",
    description: "Settings page now shows per-source sync results and a grid of all 22 Graph API endpoints with live health status.",
    icon: Shield,
    commitHash: "94251f2",
    details: [
      "Last Sync Results panel: per-source status with item counts, skip reasons, or errors",
      "API Endpoint Status grid: all 22 endpoints with green/gray/red indicators",
      "Refresh button to re-check endpoint health on demand",
      "Auto-loads when tenant is connected",
    ],
  },
  {
    version: "2.3.0",
    date: "April 10, 2026",
    type: "fix",
    title: "Drift Explanations Now Specific Per Setting",
    description: "Fixed drift events showing generic Conditional Access context for all resources. Each resource type now tracks the actual property that caused drift.",
    icon: Bug,
    commitHash: "0066838",
    details: [
      "Sync now sets accurate differingProperties per resource type (State, BlockMsolPowerShell, SharingCapability, etc.)",
      "8 new property-specific explanations with Microsoft doc links",
      "Explanations sourced from official Microsoft Learn documentation with direct links",
      "30+ settings covered: CA policies, SharePoint sharing, Teams meetings, Purview labels, Intune, Defender",
    ],
  },
  {
    version: "2.2.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Enhanced Drift Events — Per-Property Breakdown with Plain-Language Explanations",
    description: "Each drift event now shows exactly which settings don't match, with admin-friendly explanations of what the setting does, why it matters, and what to do about it.",
    icon: Sparkles,
    details: [
      "Per-property breakdown: each differing property gets its own card with desired vs actual values side-by-side",
      "Plain-language explanations for 30+ common M365/Purview/DSC settings (Conditional Access state, SharePoint sharing, Teams anonymous join, Purview encryption, etc.)",
      "Three-part context for each drift: Description (what the setting does), Risk (what could go wrong), Recommendation (what to do)",
      "Visual drift direction arrow: shows the value change from desired → actual",
      "Red left border on unresolved drift events for quick visual scanning",
      "Collapsed view shows property badges, expanded view shows full detail cards",
      "Generic fallback explanations for unknown properties",
    ],
  },
  {
    version: "2.1.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Unified Resources & Drift — Cross-Source Data Integration",
    description: "Resources and Drift pages now show a unified view across Infrastructure DSC, M365 DSC, and Purview. Source filter pills, severity breakdown, and expandable diffs for all sources.",
    icon: Sparkles,
    details: [
      "Resources page: unified view with source pills (Infrastructure, M365, Purview), grouped by resource type",
      "Drift page: merged infrastructure drift events, M365 drifted resources, and Purview label drift into one timeline",
      "Source filter pills with counts — click to filter by Infrastructure, M365, or Purview",
      "Drift resolve works across all sources (infra DriftEvent, Purview LabelDrift)",
      "All data APIs now user-scoped: nodes, configs, resources, drift filtered by authenticated user",
      "Configurations API scoped by userId, POST creates under authenticated user",
    ],
  },
  {
    version: "2.0.0",
    date: "April 10, 2026",
    type: "feature",
    title: "OneDrive, Teams, Power Platform, Fabric Workloads",
    description: "Added 5 new workloads to M365 DSC sync: OneDrive drive quota, SharePoint sites, Teams settings/channels, Power Platform environments, and Fabric capacities.",
    icon: Cloud,
    commitHash: "6ef37b7",
    details: [
      "OneDrive: drive quota, state, usage via /me/drive",
      "SharePoint: top 20 sites via /sites?search=*",
      "Teams: joined teams, per-team member/guest/messaging/fun settings, channels (top 5 teams)",
      "Power Platform: environments via /admin/powerPlatform/environments (beta)",
      "Fabric: capacities via /admin/fabric/capacities (beta)",
      "New scopes: Sites.Read.All, Team.ReadBasic.All, TeamSettings.Read.All, Channel.ReadBasic.All",
    ],
  },
  {
    version: "1.9.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Tenant Data Isolation, Mobile Responsive, Changelog",
    description: "All data APIs now scoped to the authenticated user's tenant. Mobile-responsive sidebar, header, and grid layouts. Changelog page added.",
    icon: Shield,
    commitHash: "fbc714a",
    details: [
      "Security: all data APIs use resolveTenantContext() — authenticated users only see their tenant's data",
      "Unauthenticated visitors see demo data only, authenticated users without tenant see empty states",
      "Mobile: slide-out sidebar drawer with hamburger button, responsive grids, scaled search bar",
      "Changelog page with timeline UI, version numbers, commit links to GitHub",
    ],
  },
  {
    version: "1.8.0",
    date: "April 10, 2026",
    type: "feature",
    title: "M365 DSC Live Sync via Graph API",
    description: "First live M365 DSC data sync — pulls Conditional Access, auth methods, group settings, security defaults, SharePoint, Teams, Intune, Defender, and Exchange config via Graph API.",
    icon: Cloud,
    commitHash: "4aa15ef",
    details: [
      "AAD: Conditional Access policies, auth methods, group settings, authorization policy, security defaults, named locations, directory roles, domains, cross-tenant access",
      "SharePoint: tenant sharing settings, site creation, domain restrictions",
      "Teams: app settings, resource-specific consent",
      "Intune: device compliance, config policies, app protection policies",
      "Defender: Secure Score + 30 control profiles",
      "Exchange: mailbox settings",
    ],
  },
  {
    version: "1.7.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Expanded M365 DSC — All Major Workloads via Graph API",
    description: "M365 DSC sync now pulls live data across all major workloads using native Microsoft Graph APIs.",
    icon: Cloud,
    commitHash: "4aa15ef",
    details: [
      "AAD: Conditional Access policies, auth methods, group settings, authorization policy, security defaults, named locations, directory roles, domains, cross-tenant access",
      "SharePoint: Tenant sharing settings, site creation, domain restrictions",
      "Teams: App settings, resource-specific consent",
      "Intune: Device compliance policies, device configuration policies, app protection policies",
      "Defender: Microsoft Secure Score, secure score control profiles (30+ controls)",
      "Exchange: Mailbox settings for connected user",
      "New permissions: SecurityEvents.Read.All, DeviceManagementConfiguration.Read.All, DeviceManagementApps.Read.All, MailboxSettings.Read, RoleManagement.Read.Directory",
    ],
  },
  {
    version: "1.6.0",
    date: "April 10, 2026",
    type: "fix",
    title: "Graceful Sync with License-Tier Fallbacks",
    description: "Sync now tries multiple API endpoints per data source and shows clear messaging when features require higher license tiers.",
    icon: Zap,
    commitHash: "7e7ef12",
    details: [
      "Purview labels: tries v1.0 DSG → beta InfoProtection → beta user-scoped endpoints",
      "Agent Registry: tries Copilot packages → Teams apps org catalog fallback",
      "Per-source toast notifications: success with count, skipped with license reason, or error",
      "Each source syncs independently — failures don't block other sources",
    ],
  },
  {
    version: "1.5.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Microsoft Graph Live Sync API",
    description: "First live data sync — pulls real Purview labels, Agent Registry, and org info from your connected Microsoft 365 tenant.",
    icon: Cloud,
    commitHash: "d6c860a",
    details: [
      "POST /api/microsoft/sync: authenticated endpoint using stored OAuth refresh token",
      "Syncs sensitivity labels from GET /security/dataSecurityAndGovernance/sensitivityLabels",
      "Syncs Copilot agents from GET /beta/copilot/admin/catalog/packages",
      "Syncs org info from GET /organization",
      "Sync Now button in Settings with per-source result reporting",
      "Cache invalidation after sync, graceful token refresh failure handling",
    ],
  },
  {
    version: "1.4.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Microsoft 365 OAuth2 + PKCE Connection",
    description: "Connect your Microsoft 365 tenant via OAuth2 Authorization Code flow with PKCE. No client secrets from your tenant are stored.",
    icon: Lock,
    commitHash: "3b70f72",
    details: [
      "OAuth2 Authorization Code flow with PKCE (Proof Key for Code Exchange)",
      "Refresh tokens encrypted with AES-256-GCM before storage",
      "Access tokens are short-lived (1hr), never persisted to database",
      "PKCE verifier stored in HTTP-only cookie during OAuth flow",
      "State parameter with timestamp prevents CSRF and replay attacks",
      "Automatic token rotation: if Microsoft rotates refresh token, we re-encrypt",
      "Settings page onboarding: 3-step guide, connect/reconnect/disconnect, granted permissions display",
    ],
  },
  {
    version: "1.3.0",
    date: "April 10, 2026",
    type: "security",
    title: "Hardened Authentication Security",
    description: "Major security hardening across the entire auth system — rate limiting, account lockout, stronger sessions, and better password requirements.",
    icon: Shield,
    commitHash: "2c7e9af",
    details: [
      "SHA-256 for session token hashing (replaces weak bcrypt-4 on substring)",
      "Redis-backed rate limiting: 5 attempts per 15 min on login/register",
      "Account lockout after 5 failed logins (15 min cooldown)",
      "Constant-time CSRF comparison via crypto.timingSafeEqual",
      "24h JWT lifetime with sliding window refresh (was 7 days)",
      "__Host- cookie prefix in production (enforces Secure + Path=/)",
      "Password: 10+ chars, upper+lower+number+special required",
      "Timing-safe user enumeration prevention (dummy bcrypt on miss)",
      "Security headers on all auth responses (nosniff, DENY, no-store)",
    ],
  },
  {
    version: "1.2.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Auth System, Working Search, Admin Approval Panel",
    description: "Full authentication system with secure sessions, global search across all data sources, and admin user management.",
    icon: Search,
    commitHash: "b9a2468",
    details: [
      "bcrypt password hashing (12 rounds), JWT sessions via jose (HS256)",
      "HTTP-only secure SameSite=strict cookies, no plain-text tokens",
      "First registered user auto-promoted to ADMIN",
      "Subsequent users require admin approval before login",
      "Global search API across nodes, configs, resources, M365, agents, labels",
      "Debounced search with dropdown results, type icons, status dots",
      "Admin panel (/admin): pending approval queue, user table, promote/revoke actions",
      "Auth-aware header with account dropdown menu",
      "Login/register pages with pending approval state handling",
    ],
  },
  {
    version: "1.1.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Aggregate Health Scores with Sparkline Trends",
    description: "Dashboard now shows an overall health ring chart aggregating all 4 data sources, with per-source sparkline trend charts.",
    icon: TrendingUp,
    commitHash: "7bc810e",
    details: [
      "Overall Health ring chart averaging Infrastructure, M365, Agents, and Purview scores",
      "Per-source aggregate %: Infra (node compliance), M365 (workload compliance), Agents (deployed/total), Purview (enabled-no-drift/total)",
      "Custom SVG sparkline component showing 14-day trend for each aggregate",
      "Sparklines displayed inline next to aggregate % in each card header",
    ],
  },
  {
    version: "1.0.0",
    date: "April 10, 2026",
    type: "feature",
    title: "Initial Release — DSC Dashboard with M365 DSC + Agent 365 + Purview",
    description: "Full-featured dashboard for PowerShell DSC v3, Microsoft365DSC, Agent 365 Registry, and Microsoft Purview sensitivity labels.",
    icon: Database,
    commitHash: "f7124bb",
    details: [
      "Infrastructure DSC: 20 nodes, 10 configs, 48 resources, drift tracking across prod/staging/dev",
      "M365 DSC: 31 resources across 8 workloads (AAD, EXO, SPO, Teams, Intune, SC, Defender, OD)",
      "Agent 365 Registry: 16 Copilot agents (Microsoft, External, Custom, Shared) with governance tracking",
      "Purview: 13 sensitivity labels (5-tier taxonomy), 10 protection scopes, 7 drift events",
      "Unified dashboard with KPIs across all sources",
      "Deployed on Vercel + Railway (PostgreSQL + Redis)",
      "Light theme with red/blue/green/yellow accent colors",
      "Custom component library: Card, Badge, Button, StatusDot, Sparkline, EmptyState",
    ],
  },
];

const typeBadge: Record<string, { variant: "compliant" | "active" | "drifted"; label: string }> = {
  feature: { variant: "active", label: "Feature" },
  security: { variant: "compliant", label: "Security" },
  fix: { variant: "drifted", label: "Fix" },
};

export default function ChangelogPage() {
  return (
    <div className="space-y-6 stagger-children max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Changelog</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">Release history and updates</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-dsc-border" />

        <div className="space-y-6">
          {changelog.map((entry, i) => {
            const Icon = entry.icon;
            const badge = typeBadge[entry.type];
            return (
              <div key={i} className="relative pl-12 animate-gravity-in">
                {/* Timeline dot */}
                <div className="absolute left-0 top-6 h-10 w-10 rounded-full bg-dsc-surface border-2 border-dsc-border flex items-center justify-center z-10">
                  <Icon className="h-4 w-4 text-dsc-blue" />
                </div>

                <Card>
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-dsc-text">v{entry.version}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {entry.commitHash && (
                            <a
                              href={`https://github.com/justinericsnyder/M365DSCDash/commit/${entry.commitHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-dsc-text-secondary hover:text-dsc-blue font-mono"
                            >
                              <GitCommit className="h-3 w-3" />{entry.commitHash}
                            </a>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-dsc-text">{entry.title}</h3>
                      </div>
                      <span className="text-xs text-dsc-text-secondary whitespace-nowrap">{entry.date}</span>
                    </div>

                    <p className="text-sm text-dsc-text-secondary mb-3">{entry.description}</p>

                    <ul className="space-y-1.5">
                      {entry.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-dsc-text-secondary">
                          <Sparkles className="h-3 w-3 text-dsc-blue flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

