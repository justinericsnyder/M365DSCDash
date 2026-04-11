"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { Sparkline } from "@/components/ui/sparkline";
import { timeAgo } from "@/lib/utils";
import {
  Server, AlertTriangle, CheckCircle2,
  Shield, Database, Cloud, Bot, ShieldCheck, Lock,
  TrendingUp, Activity, Gauge,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Generate simulated historical trend data based on current value
// In production this would come from a time-series table
function generateTrend(current: number, days: number = 14): number[] {
  const points: number[] = [];
  let val = Math.max(current - 15 - Math.random() * 10, 30);
  for (let i = 0; i < days; i++) {
    const drift = (Math.random() - 0.35) * 4; // slight upward bias
    val = Math.min(100, Math.max(20, val + drift));
    points.push(Math.round(val * 10) / 10);
  }
  points.push(current); // ensure last point is the real value
  return points;
}

function pctColor(pct: number): string {
  if (pct >= 90) return "text-dsc-green";
  if (pct >= 70) return "text-dsc-yellow";
  return "text-dsc-red";
}

function pctBarColor(pct: number): string {
  if (pct >= 90) return "bg-dsc-green";
  if (pct >= 70) return "bg-dsc-yellow";
  return "bg-dsc-red";
}

function pctStrokeColor(pct: number): string {
  if (pct >= 90) return "#38A169";
  if (pct >= 70) return "#D69E2E";
  return "#E53E3E";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      toast.success("All demo data loaded");
      window.location.reload();
    } catch { toast.error("Seed failed"); }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-dsc-border/30 rounded-lg" />
      <div className="h-4 w-72 bg-dsc-border/20 rounded" />
      <div className="rounded-xl border border-dsc-border bg-dsc-surface p-6 h-32" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="rounded-xl border border-dsc-border bg-dsc-surface p-6 h-28" />)}
      </div>
    </div>
  );

  const hasAnyData = stats?.infra?.nodes?.total > 0 || stats?.m365?.hasTenant || stats?.agents?.hasAgents || stats?.purview?.hasData;

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-dsc-blue-50 p-6 mb-6"><Database className="h-12 w-12 text-dsc-blue" /></div>
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Welcome to DSC Dashboard</h2>
        <p className="text-dsc-text-secondary max-w-md mb-8">Manage DSC configurations, M365 tenant compliance, Copilot agents, and Purview sensitivity labels from one place.</p>
        <Button onClick={handleSeedAll} size="lg"><Database className="h-4 w-4" />Load All Demo Data</Button>
      </div>
    );
  }

  const { infra, m365, agents, purview } = stats;

  // ─── Compute aggregate percentages ────────────────────
  // Infra: node compliance rate
  const infraPct = infra?.compliance?.rate ?? 0;

  // M365: aggregate compliance across all workloads
  let m365Total = 0, m365Compliant = 0;
  if (m365?.workloads) {
    Object.values(m365.workloads as Record<string, { total: number; compliant: number }>).forEach((wl) => {
      m365Total += wl.total;
      m365Compliant += wl.compliant;
    });
  }
  const m365Pct = m365Total > 0 ? Math.round((m365Compliant / m365Total) * 100) : 0;

  // Agents: % deployed (healthy governance = deployed / total)
  const agentsPct = agents?.totals?.total > 0
    ? Math.round((agents.totals.deployed / agents.totals.total) * 100)
    : 0;

  // Purview: % labels enabled with no drift
  const purviewLabelsTotal = purview?.labels?.total || 0;
  const purviewLabelsHealthy = (purview?.labels?.enabled || 0) - (purview?.drift?.unresolved || 0);
  const purviewPct = purviewLabelsTotal > 0
    ? Math.round((Math.max(0, purviewLabelsHealthy) / purviewLabelsTotal) * 100)
    : 0;

  // Overall aggregate
  const activeSources: number[] = [];
  if (infra?.nodes?.total > 0) activeSources.push(infraPct);
  if (m365Total > 0) activeSources.push(m365Pct);
  if (agents?.totals?.total > 0) activeSources.push(agentsPct);
  if (purviewLabelsTotal > 0) activeSources.push(purviewPct);
  const overallPct = activeSources.length > 0
    ? Math.round(activeSources.reduce((a, b) => a + b, 0) / activeSources.length)
    : 0;

  // Sparkline data
  const overallTrend = generateTrend(overallPct);
  const infraTrend = generateTrend(infraPct);
  const m365Trend = generateTrend(m365Pct);
  const agentsTrend = generateTrend(agentsPct);
  const purviewTrend = generateTrend(purviewPct);

  return (
    <div className="space-y-6 stagger-children">
      <div className="animate-gravity-in">
        <h2 className="text-2xl font-bold text-dsc-text">Dashboard</h2>
        <p className="text-sm text-dsc-text-secondary mt-1.5 leading-relaxed">Unified view across infrastructure, M365, agents, and Purview</p>
      </div>

      {/* ─── Overall Health Summary ──────────────────────── */}
      <Card className="border-dsc-border/60 bg-gradient-to-r from-dsc-surface to-dsc-bg animate-gravity-in">
        <div className="flex items-center gap-8">
          {/* Overall Score */}
          <div className="flex items-center gap-4 pr-8 border-r border-dsc-border">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={pctStrokeColor(overallPct)} strokeWidth="6"
                  strokeDasharray={`${(overallPct / 100) * 213.6} 213.6`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${pctColor(overallPct)}`}>{overallPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-dsc-text">Overall Health</p>
              <p className="text-xs text-dsc-text-secondary">{activeSources.length} sources</p>
              <Sparkline data={overallTrend} width={100} height={24} color={pctStrokeColor(overallPct)} fillColor={pctStrokeColor(overallPct)} className="mt-1" />
              <p className="text-[10px] text-dsc-text-secondary mt-0.5">14-day trend</p>
            </div>
          </div>

          {/* Individual Source Aggregates */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {infra?.nodes?.total > 0 && (
              <SourceAggregate label="Infrastructure" pct={infraPct} trend={infraTrend} icon={Server} href="/nodes" color="green" />
            )}
            {m365Total > 0 && (
              <SourceAggregate label="M365 DSC" pct={m365Pct} trend={m365Trend} icon={Cloud} href="/m365" color="blue" />
            )}
            {agents?.totals?.total > 0 && (
              <SourceAggregate label="Agent Registry" pct={agentsPct} trend={agentsTrend} icon={Bot} href="/agents" color="purple" sub={`${agents.totals.deployed}/${agents.totals.total} deployed`} />
            )}
            {purviewLabelsTotal > 0 && (
              <SourceAggregate label="Purview Labels" pct={purviewPct} trend={purviewTrend} icon={ShieldCheck} href="/purview" color="yellow" sub={`${purview.drift?.unresolved || 0} drift`} />
            )}
          </div>
        </div>
      </Card>

      {/* ─── Detail Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Infrastructure Compliance */}
        {infra?.nodes?.total > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-dsc-green" />Infrastructure DSC</CardTitle>
                <div className="flex items-center gap-2">
                  <Sparkline data={infraTrend} width={64} height={22} color={pctStrokeColor(infraPct)} fillColor={pctStrokeColor(infraPct)} />
                  <span className={`text-lg font-bold ${pctColor(infraPct)}`}>{infraPct}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-dsc-border/30"><div className={`h-2 rounded-full ${pctBarColor(infraPct)} transition-all`} style={{ width: `${infraPct}%` }} /></div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div><p className="font-bold text-dsc-green">{infra.nodes.compliant}</p><p className="text-dsc-text-secondary">Compliant</p></div>
                  <div><p className="font-bold text-dsc-yellow">{infra.nodes.drifted}</p><p className="text-dsc-text-secondary">Drifted</p></div>
                  <div><p className="font-bold text-dsc-red">{infra.nodes.error}</p><p className="text-dsc-text-secondary">Error</p></div>
                  <div><p className="font-bold">{infra.configurations.active}</p><p className="text-dsc-text-secondary">Configs</p></div>
                </div>
                {infra.drift?.unresolved > 0 && (
                  <Link href="/drift" className="flex items-center gap-2 p-2 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-sm text-dsc-red hover:bg-dsc-red-50/80">
                    <AlertTriangle className="h-4 w-4" />{infra.drift.unresolved} unresolved drift events
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* M365 DSC Workloads */}
        {m365?.workloads && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Cloud className="h-4 w-4 text-dsc-blue" />M365 DSC Workloads</CardTitle>
                <div className="flex items-center gap-2">
                  <Sparkline data={m365Trend} width={64} height={22} color={pctStrokeColor(m365Pct)} fillColor={pctStrokeColor(m365Pct)} />
                  <span className={`text-lg font-bold ${pctColor(m365Pct)}`}>{m365Pct}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(m365.workloads as Record<string, { total: number; compliant: number; drifted: number }>).map(([key, wl]) => {
                  const pct = wl.total > 0 ? Math.round((wl.compliant / wl.total) * 100) : 100;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-16 text-dsc-text-secondary">{key}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-dsc-border/30"><div className={`h-1.5 rounded-full ${pctBarColor(pct)}`} style={{ width: `${pct}%` }} /></div>
                      <span className={`text-xs w-8 text-right font-medium ${pctColor(pct)}`}>{pct}%</span>
                      {wl.drifted > 0 && <span className="text-[10px] text-dsc-red">{wl.drifted}d</span>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-dsc-border flex items-center justify-between text-xs text-dsc-text-secondary">
                <span>{m365Compliant}/{m365Total} resources compliant</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Registry Summary */}
        {agents?.totals && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-purple-600" />Agent 365 Registry</CardTitle>
                <div className="flex items-center gap-2">
                  <Sparkline data={agentsTrend} width={64} height={22} color="#7C3AED" fillColor="#7C3AED" />
                  <span className={`text-lg font-bold ${pctColor(agentsPct)}`}>{agentsPct}%</span>
                  <span className="text-xs font-normal text-dsc-text-secondary">deployed</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-dsc-blue-50"><Shield className="h-4 w-4 text-dsc-blue" /><div><p className="font-bold text-sm">{agents.totals.microsoft}</p><p className="text-[10px] text-dsc-text-secondary">Microsoft</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50"><Activity className="h-4 w-4 text-orange-600" /><div><p className="font-bold text-sm">{agents.totals.external}</p><p className="text-[10px] text-dsc-text-secondary">External</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50"><Bot className="h-4 w-4 text-purple-600" /><div><p className="font-bold text-sm">{agents.totals.custom}</p><p className="text-[10px] text-dsc-text-secondary">Custom</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-dsc-green-50"><TrendingUp className="h-4 w-4 text-dsc-green" /><div><p className="font-bold text-sm">{agents.totals.shared}</p><p className="text-[10px] text-dsc-text-secondary">Shared</p></div></div>
              </div>
              <div className="h-1.5 rounded-full bg-dsc-border/30 mb-2"><div className={`h-1.5 rounded-full ${pctBarColor(agentsPct)}`} style={{ width: `${agentsPct}%` }} /></div>
              <div className="flex items-center justify-between text-xs text-dsc-text-secondary">
                <span>{agents.totals.deployed}/{agents.totals.total} deployed · {agents.totals.pinned} pinned{agents.totals.blocked > 0 ? ` · ${agents.totals.blocked} blocked` : ""}{agents.totals.withRisks > 0 ? ` · ${agents.totals.totalRiskCount} risks` : ""}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purview Labels & Drift */}
        {purview?.labels && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-dsc-yellow" />Purview Sensitivity Labels</CardTitle>
                <div className="flex items-center gap-2">
                  <Sparkline data={purviewTrend} width={64} height={22} color={pctStrokeColor(purviewPct)} fillColor={pctStrokeColor(purviewPct)} />
                  <span className={`text-lg font-bold ${pctColor(purviewPct)}`}>{purviewPct}%</span>
                  <span className="text-xs font-normal text-dsc-text-secondary">healthy</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                <div><p className="font-bold text-lg">{purview.labels.total}</p><p className="text-dsc-text-secondary">Labels</p></div>
                <div><p className="font-bold text-lg text-dsc-blue">{purview.labels.withProtection}</p><p className="text-dsc-text-secondary">Encrypted</p></div>
                <div><p className="font-bold text-lg text-orange-600">{purview.labels.withEndpointProtection}</p><p className="text-dsc-text-secondary">Endpoint DLP</p></div>
                <div><p className="font-bold text-lg text-dsc-red">{purview.drift?.unresolved || 0}</p><p className="text-dsc-text-secondary">Drift</p></div>
              </div>
              <div className="h-1.5 rounded-full bg-dsc-border/30 mb-2"><div className={`h-1.5 rounded-full ${pctBarColor(purviewPct)}`} style={{ width: `${purviewPct}%` }} /></div>
              <div className="space-y-1 mb-2">
                {purview.labelHierarchy?.slice(0, 4).map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 p-1.5 rounded">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color || "#718096" }} />
                    <span className="text-xs font-medium">{l.displayName}</span>
                    {l.hasProtection && <Lock className="h-3 w-3 text-dsc-blue" />}
                    {l.sublabels?.length > 0 && <span className="text-[10px] text-dsc-text-secondary">+{l.sublabels.length} sub</span>}
                    {l._count?.driftEvents > 0 && <Badge variant="drifted" className="text-[9px] px-1 py-0">{l._count.driftEvents}</Badge>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-dsc-text-secondary">
                <span>{purview.labels.enabled} enabled · {purview.drift?.unresolved || 0} drift{purview.drift?.critical ? ` (${purview.drift.critical} critical)` : ""}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Drift */}
      {infra?.drift?.recent?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-dsc-yellow" />Recent Infrastructure Drift</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-dsc-border">
              {infra.drift.recent.slice(0, 5).map((event: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <StatusDot status={event.severity} pulse={!event.resolved} />
                    <div>
                      <p className="text-sm font-medium">{event.node?.name || "Unknown"}</p>
                      <p className="text-xs text-dsc-text-secondary">{(event.differingProperties || []).join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.severity?.toLowerCase() as any}>{event.severity}</Badge>
                    <span className="text-xs text-dsc-text-secondary">{timeAgo(event.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Source Aggregate Card ────────────────────────────── */
function SourceAggregate({ label, pct, trend, icon: Icon, href, color, sub }: {
  label: string; pct: number; trend: number[]; icon: React.ElementType; href: string; color: string; sub?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; stroke: string }> = {
    green: { bg: "bg-dsc-green-50", text: "text-dsc-green", stroke: "#38A169" },
    blue: { bg: "bg-dsc-blue-50", text: "text-dsc-blue", stroke: "#3182CE" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", stroke: "#7C3AED" },
    yellow: { bg: "bg-dsc-yellow-50", text: "text-dsc-yellow", stroke: "#D69E2E" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Link href={href} className="group">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dsc-bg transition-colors">
        <div className={`rounded-lg ${c.bg} p-1.5`}><Icon className={`h-4 w-4 ${c.text}`} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-bold ${pctColor(pct)}`}>{pct}%</span>
            <Sparkline data={trend} width={48} height={16} color={c.stroke} />
          </div>
          <p className="text-[10px] text-dsc-text-secondary truncate">{label}</p>
          {sub && <p className="text-[9px] text-dsc-text-secondary">{sub}</p>}
        </div>
      </div>
    </Link>
  );
}

