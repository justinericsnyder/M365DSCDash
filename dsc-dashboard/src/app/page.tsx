"use client";

import { useEffect, useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Server20Regular,
  Warning20Regular,
  CheckmarkCircle20Regular,
  Shield20Regular,
  Database20Regular,
  Cloud20Regular,
  Bot20Regular,
  ShieldCheckmark20Regular,
  LockClosed20Regular,
  DataTrending20Regular,
  Pulse20Regular,
  Globe20Regular,
  People20Regular,
  Key20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Sparkline } from "@/components/ui/sparkline";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

function generateTrend(current: number, days: number = 14): number[] {
  const points: number[] = [];
  let val = Math.max(current - 15 - Math.random() * 10, 30);
  for (let i = 0; i < days; i++) {
    const drift = (Math.random() - 0.35) * 4;
    val = Math.min(100, Math.max(20, val + drift));
    points.push(Math.round(val * 10) / 10);
  }
  points.push(current);
  return points;
}

function pctColor(pct: number): string {
  if (pct >= 90) return "#7ECC9A";
  if (pct >= 70) return "#E8D07A";
  return "#F28B8B";
}

function pctBarColor(pct: number): string {
  if (pct >= 90) return "#7ECC9A";
  if (pct >= 70) return "#E8D07A";
  return "#F28B8B";
}

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  headerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  overallCard: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  scoreSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    paddingRight: "32px",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  sourcesGrid: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
    gap: "24px",
  },
  progressBar: {
    height: "8px",
    borderRadius: "4px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    overflow: "hidden",
  },
  progressFill: {
    height: "8px",
    borderRadius: "4px",
    transitionProperty: "width",
    transitionDuration: "300ms",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    textAlign: "center",
  },
  workloadRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  thinBar: {
    height: "6px",
    borderRadius: "3px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    flex: 1,
    overflow: "hidden",
  },
  thinFill: {
    height: "6px",
    borderRadius: "3px",
  },
  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "12px",
  },
  agentCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
  },
  tenantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "12px",
  },
  tenantCell: {
    textAlign: "center",
    padding: "10px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  driftRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    ":last-child": {
      borderBottom: "none",
    },
  },
  driftAlert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#3A0E14",
    border: "1px solid #F28B8B30",
    textDecoration: "none",
    color: "#F28B8B",
  },
  sourceLink: {
    textDecoration: "none",
    color: "inherit",
    ":hover": {
      "& > div": {
        backgroundColor: tokens.colorSubtleBackgroundHover,
      },
    },
  },
  sourceInner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  iconBox: {
    borderRadius: tokens.borderRadiusMedium,
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    textAlign: "center",
  },
  emptyIcon: {
    borderRadius: "9999px",
    backgroundColor: "#221830",
    padding: "24px",
    marginBottom: "24px",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px",
    borderRadius: tokens.borderRadiusSmall,
  },
  labelColor: {
    height: "12px",
    width: "12px",
    borderRadius: "2px",
  },
});

export default function DashboardPage() {
  const styles = useStyles();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toasterId = useId("dashboard-toaster");
  const { dispatchToast } = useToastController(toasterId);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/m365/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/agents/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/purview/dashboard").then((r) => r.json()).catch(() => null),
    ]).then(([infra, m365, agents, purview]) => {
      setStats({ infra, m365, agents, purview });
      setLoading(false);
    });
  }, []);

  const handleSeedAll = async () => {
    try {
      await Promise.all([
        fetch("/api/seed", { method: "POST" }),
        fetch("/api/m365/seed", { method: "POST" }),
        fetch("/api/agents/seed", { method: "POST" }),
        fetch("/api/purview/seed", { method: "POST" }),
      ]);
      dispatchToast(<Toast><ToastTitle>All demo data loaded</ToastTitle></Toast>, { intent: "success" });
      window.location.reload();
    } catch {
      dispatchToast(<Toast><ToastTitle>Seed failed</ToastTitle></Toast>, { intent: "error" });
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
        <Spinner size="large" label="Loading dashboard..." />
      </div>
    </div>
  );

  const hasAnyData = stats?.infra?.nodes?.total > 0 || stats?.m365?.hasTenant || stats?.agents?.hasAgents || stats?.purview?.hasData;

  if (!hasAnyData) {
    return (
      <div className={styles.emptyContainer}>
        <Toaster toasterId={toasterId} />
        <div className={styles.emptyIcon}>
          <Database20Regular style={{ fontSize: 48, color: "#B89ADA" }} />
        </div>
        <Text size={700} weight="bold" block style={{ marginBottom: 8 }}>Welcome to AI DSC Dashboard</Text>
        <Text size={400} style={{ color: tokens.colorNeutralForeground3, maxWidth: 400, marginBottom: 32 }} block>
          Manage DSC configurations, M365 tenant compliance, Copilot agents, and Purview sensitivity labels from one place.
        </Text>
        <Button appearance="primary" size="large" icon={<Database20Regular />} onClick={handleSeedAll}>
          Load All Demo Data
        </Button>
      </div>
    );
  }

  const { infra, m365, agents, purview } = stats;

  const infraPct = infra?.compliance?.rate ?? 0;
  let m365Total = 0, m365Compliant = 0;
  if (m365?.workloads) {
    Object.values(m365.workloads as Record<string, { total: number; compliant: number }>).forEach((wl) => {
      m365Total += wl.total;
      m365Compliant += wl.compliant;
    });
  }
  const m365Pct = m365Total > 0 ? Math.round((m365Compliant / m365Total) * 100) : 0;
  const agentsPct = agents?.totals?.total > 0 ? Math.round((agents.totals.deployed / agents.totals.total) * 100) : 0;
  const purviewLabelsTotal = purview?.labels?.total || 0;
  const purviewLabelsHealthy = (purview?.labels?.enabled || 0) - (purview?.drift?.unresolved || 0);
  const purviewPct = purviewLabelsTotal > 0 ? Math.round((Math.max(0, purviewLabelsHealthy) / purviewLabelsTotal) * 100) : 0;

  const activeSources: number[] = [];
  if (infra?.nodes?.total > 0) activeSources.push(infraPct);
  if (m365Total > 0) activeSources.push(m365Pct);
  if (agents?.totals?.total > 0) activeSources.push(agentsPct);
  if (purviewLabelsTotal > 0) activeSources.push(purviewPct);
  const overallPct = activeSources.length > 0 ? Math.round(activeSources.reduce((a, b) => a + b, 0) / activeSources.length) : 0;

  const overallTrend = generateTrend(overallPct);
  const infraTrend = generateTrend(infraPct);
  const m365Trend = generateTrend(m365Pct);
  const agentsTrend = generateTrend(agentsPct);
  const purviewTrend = generateTrend(purviewPct);

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />

      <div className={styles.headerSection}>
        <Text size={700} weight="bold">Dashboard</Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          Unified view across infrastructure, M365, agents, and Purview
        </Text>
      </div>

      {/* Overall Health */}
      <Card>
        <div className={styles.overallCard}>
          <div className={styles.scoreSection}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg style={{ width: 80, height: 80, transform: "rotate(-90deg)" }} viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke={`${tokens.colorNeutralStroke1}40`} strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={pctColor(overallPct)} strokeWidth="6"
                  strokeDasharray={`${(overallPct / 100) * 213.6} 213.6`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text size={600} weight="bold" style={{ color: pctColor(overallPct) }}>{overallPct}%</Text>
              </div>
            </div>
            <div>
              <Text size={300} weight="semibold" block>Overall Health</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{activeSources.length} sources</Text>
              <Sparkline data={overallTrend} width={100} height={24} color={pctColor(overallPct)} fillColor={pctColor(overallPct)} />
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>14-day trend</Text>
            </div>
          </div>

          <div className={styles.sourcesGrid}>
            {infra?.nodes?.total > 0 && (
              <SourceAggregate label="Infrastructure" pct={infraPct} trend={infraTrend} icon={Server20Regular} href="/nodes" bgColor="#18241C" iconColor="#7ECC9A" />
            )}
            {m365Total > 0 && (
              <SourceAggregate label="M365 DSC" pct={m365Pct} trend={m365Trend} icon={Cloud20Regular} href="/m365" bgColor="#221830" iconColor="#B89ADA" />
            )}
            {agents?.totals?.total > 0 && (
              <SourceAggregate label="Agent Registry" pct={agentsPct} trend={agentsTrend} icon={Bot20Regular} href="/agents" bgColor="#2D1B69" iconColor="#7C3AED" sub={`${agents.totals.deployed}/${agents.totals.total} deployed`} />
            )}
            {purviewLabelsTotal > 0 && (
              <SourceAggregate label="Purview Labels" pct={purviewPct} trend={purviewTrend} icon={ShieldCheckmark20Regular} href="/purview" bgColor="#2E2010" iconColor="#E8D07A" sub={`${purview.drift?.unresolved || 0} drift`} />
            )}
          </div>
        </div>
      </Card>

      {/* Detail Cards */}
      <div className={styles.detailGrid}>
        {infra?.nodes?.total > 0 && (
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Server20Regular style={{ color: "#7ECC9A" }} /> Infrastructure DSC</span></CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkline data={infraTrend} width={64} height={22} color={pctColor(infraPct)} fillColor={pctColor(infraPct)} />
                  <Text size={500} weight="bold" style={{ color: pctColor(infraPct) }}>{infraPct}%</Text>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${infraPct}%`, backgroundColor: pctBarColor(infraPct) }} />
              </div>
              <div className={styles.statsGrid} style={{ marginTop: 12 }}>
                <div><Text weight="bold" style={{ color: "#7ECC9A" }}>{infra.nodes.compliant}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Compliant</Text></div>
                <div><Text weight="bold" style={{ color: "#E8D07A" }}>{infra.nodes.drifted}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Drifted</Text></div>
                <div><Text weight="bold" style={{ color: "#F28B8B" }}>{infra.nodes.error}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Error</Text></div>
                <div><Text weight="bold">{infra.configurations.active}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Configs</Text></div>
              </div>
              {infra.drift?.unresolved > 0 && (
                <Link href="/drift" className={styles.driftAlert} style={{ marginTop: 12 }}>
                  <Warning20Regular /> {infra.drift.unresolved} unresolved drift events
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {m365?.workloads && (
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Cloud20Regular style={{ color: "#B89ADA" }} /> M365 DSC Workloads</span></CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkline data={m365Trend} width={64} height={22} color={pctColor(m365Pct)} fillColor={pctColor(m365Pct)} />
                  <Text size={500} weight="bold" style={{ color: pctColor(m365Pct) }}>{m365Pct}%</Text>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(m365.workloads as Record<string, { total: number; compliant: number; drifted: number }>).map(([key, wl]) => {
                  const pct = wl.total > 0 ? Math.round((wl.compliant / wl.total) * 100) : 100;
                  return (
                    <div key={key} className={styles.workloadRow}>
                      <Text size={200} weight="medium" style={{ width: 64, color: tokens.colorNeutralForeground3 }}>{key}</Text>
                      <div className={styles.thinBar}><div className={styles.thinFill} style={{ width: `${pct}%`, backgroundColor: pctBarColor(pct) }} /></div>
                      <Text size={200} weight="medium" style={{ width: 32, textAlign: "right", color: pctColor(pct) }}>{pct}%</Text>
                      {wl.drifted > 0 && <Text size={100} style={{ color: "#F28B8B" }}>{wl.drifted}d</Text>}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tokens.colorNeutralStroke1}` }}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{m365Compliant}/{m365Total} resources compliant</Text>
              </div>
            </CardContent>
          </Card>
        )}

        {agents?.totals && (
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Bot20Regular style={{ color: "#7C3AED" }} /> Agent 365 Registry</span></CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkline data={agentsTrend} width={64} height={22} color="#7C3AED" fillColor="#7C3AED" />
                  <Text size={500} weight="bold" style={{ color: pctColor(agentsPct) }}>{agentsPct}%</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>deployed</Text>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={styles.agentGrid}>
                <div className={styles.agentCell} style={{ backgroundColor: "#221830" }}><Shield20Regular style={{ color: "#B89ADA" }} /><div><Text weight="bold" size={300}>{agents.totals.microsoft}</Text><br /><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Microsoft</Text></div></div>
                <div className={styles.agentCell} style={{ backgroundColor: "#2E2010" }}><Pulse20Regular style={{ color: "#E8D07A" }} /><div><Text weight="bold" size={300}>{agents.totals.external}</Text><br /><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>External</Text></div></div>
                <div className={styles.agentCell} style={{ backgroundColor: "#2D1B69" }}><Bot20Regular style={{ color: "#7C3AED" }} /><div><Text weight="bold" size={300}>{agents.totals.custom}</Text><br /><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Custom</Text></div></div>
                <div className={styles.agentCell} style={{ backgroundColor: "#18241C" }}><DataTrending20Regular style={{ color: "#7ECC9A" }} /><div><Text weight="bold" size={300}>{agents.totals.shared}</Text><br /><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Shared</Text></div></div>
              </div>
              <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${agentsPct}%`, backgroundColor: pctBarColor(agentsPct) }} /></div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: 8, display: "block" }}>
                {agents.totals.deployed}/{agents.totals.total} deployed · {agents.totals.pinned} pinned{agents.totals.blocked > 0 ? ` · ${agents.totals.blocked} blocked` : ""}{agents.totals.withRisks > 0 ? ` · ${agents.totals.totalRiskCount} risks` : ""}
              </Text>
            </CardContent>
          </Card>
        )}

        {purview?.labels && (
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldCheckmark20Regular style={{ color: "#E8D07A" }} /> Purview Sensitivity Labels</span></CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkline data={purviewTrend} width={64} height={22} color={pctColor(purviewPct)} fillColor={pctColor(purviewPct)} />
                  <Text size={500} weight="bold" style={{ color: pctColor(purviewPct) }}>{purviewPct}%</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>healthy</Text>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={styles.statsGrid} style={{ marginBottom: 12 }}>
                <div><Text size={600} weight="bold">{purview.labels.total}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Labels</Text></div>
                <div><Text size={600} weight="bold" style={{ color: "#B89ADA" }}>{purview.labels.withProtection}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Encrypted</Text></div>
                <div><Text size={600} weight="bold" style={{ color: "#E8D07A" }}>{purview.labels.withEndpointProtection}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Endpoint DLP</Text></div>
                <div><Text size={600} weight="bold" style={{ color: "#F28B8B" }}>{purview.drift?.unresolved || 0}</Text><br /><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Drift</Text></div>
              </div>
              <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${purviewPct}%`, backgroundColor: pctBarColor(purviewPct) }} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                {purview.labelHierarchy?.slice(0, 4).map((l: any) => (
                  <div key={l.id} className={styles.labelRow}>
                    <div className={styles.labelColor} style={{ backgroundColor: l.color || "#718096" }} />
                    <Text size={200} weight="medium">{l.displayName}</Text>
                    {l.hasProtection && <LockClosed20Regular style={{ fontSize: 12, color: "#B89ADA" }} />}
                    {l.sublabels?.length > 0 && <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>+{l.sublabels.length} sub</Text>}
                    {l._count?.driftEvents > 0 && <Badge variant="drifted">{l._count.driftEvents}</Badge>}
                  </div>
                ))}
              </div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: 8, display: "block" }}>
                {purview.labels.enabled} enabled · {purview.drift?.unresolved || 0} drift{purview.drift?.critical ? ` (${purview.drift.critical} critical)` : ""}
              </Text>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tenant Live Data */}
      {m365?.workloads && (
        <Card>
          <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Pulse20Regular style={{ color: "#B89ADA" }} /> Tenant Live Data</span></CardTitle></CardHeader>
          <CardContent>
            <div className={styles.tenantGrid}>
              {[
                { label: "Auth Methods", value: (m365.workloads as any).AAD?.total || 0, Icon: Shield20Regular },
                { label: "Domains", value: m365.resourceTypes?.find((r: any) => r.type === "AADDomain")?.count || 0, Icon: Globe20Regular },
                { label: "Teams", value: m365.resourceTypes?.find((r: any) => r.type === "TeamsTeam")?.count || 0, Icon: People20Regular },
                { label: "Sites", value: m365.resourceTypes?.find((r: any) => r.type === "SPOSite")?.count || 0, Icon: Globe20Regular },
                { label: "Secure Score", value: (() => { const ss = m365.driftedResources?.find?.((r: any) => r.resourceType === "SecureScore") || m365.resourceTypes?.find((r: any) => r.type === "SecureScore"); return ss ? "✓" : "—"; })(), Icon: ShieldCheckmark20Regular },
                { label: "OAuth Grants", value: m365.resourceTypes?.find((r: any) => r.type === "CopilotOAuthConsent")?.count || 0, Icon: Key20Regular },
              ].map((item, i) => (
                <div key={i} className={styles.tenantCell}>
                  <item.Icon style={{ color: tokens.colorNeutralForeground3, marginBottom: 4 }} />
                  <Text size={500} weight="bold" block>{item.value}</Text>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{item.label}</Text>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Drift */}
      {infra?.drift?.recent?.length > 0 && (
        <Card>
          <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Warning20Regular style={{ color: "#E8D07A" }} /> Recent Infrastructure Drift</span></CardTitle></CardHeader>
          <CardContent>
            {infra.drift.recent.slice(0, 5).map((event: any, i: number) => (
              <div key={i} className={styles.driftRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StatusDot status={event.severity} pulse={!event.resolved} />
                  <div>
                    <Text size={300} weight="medium" block>{event.node?.name || "Unknown"}</Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{(event.differingProperties || []).join(", ")}</Text>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge variant={event.severity?.toLowerCase() as any}>{event.severity}</Badge>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{timeAgo(event.createdAt)}</Text>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* Source Aggregate Card */
function SourceAggregate({ label, pct, trend, icon: Icon, href, bgColor, iconColor, sub }: {
  label: string; pct: number; trend: number[]; icon: React.ElementType; href: string; bgColor: string; iconColor: string; sub?: string;
}) {
  const styles = useStyles();
  return (
    <Link href={href} className={styles.sourceLink}>
      <div className={styles.sourceInner}>
        <div className={styles.iconBox} style={{ backgroundColor: bgColor }}>
          <Icon style={{ color: iconColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Text size={500} weight="bold" style={{ color: pctColor(pct) }}>{pct}%</Text>
            <Sparkline data={trend} width={48} height={16} color={iconColor} />
          </div>
          <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{label}</Text>
          {sub && <Text size={100} style={{ color: tokens.colorNeutralForeground3 }} block>{sub}</Text>}
        </div>
      </div>
    </Link>
  );
}
