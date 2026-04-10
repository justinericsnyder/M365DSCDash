"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  Server, FileCode2, Blocks, AlertTriangle, CheckCircle2, XCircle,
  Shield, Database, Cloud, Bot, ShieldCheck, Tag, Lock, Monitor,
  TrendingUp, Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AllStats {
  infra: any;
  m365: any;
  agents: any;
  purview: any;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AllStats | null>(null);
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;

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

  const infra = stats?.infra;
  const m365 = stats?.m365;
  const agents = stats?.agents;
  const purview = stats?.purview;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Dashboard</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">Unified view across infrastructure, M365, agents, and Purview</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infra?.nodes?.total > 0 && (
          <Link href="/nodes"><Card hover><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2.5"><Server className="h-5 w-5 text-dsc-green" /></div><div><p className="text-2xl font-bold">{infra.nodes.total}</p><p className="text-xs text-dsc-text-secondary">Nodes · {infra.compliance.rate}% compliant</p></div></div></Card></Link>
        )}
        {m365?.totals && (
          <Link href="/m365"><Card hover><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2.5"><Cloud className="h-5 w-5 text-dsc-blue" /></div><div><p className="text-2xl font-bold">{m365.totals.resources}</p><p className="text-xs text-dsc-text-secondary">M365 Resources · {m365.totals.complianceRate}%</p></div></div></Card></Link>
        )}
        {agents?.totals && (
          <Link href="/agents"><Card hover><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2.5"><Bot className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{agents.totals.total}</p><p className="text-xs text-dsc-text-secondary">Agents · {agents.totals.deployed} deployed</p></div></div></Card></Link>
        )}
        {purview?.labels && (
          <Link href="/purview"><Card hover><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-yellow-50 p-2.5"><ShieldCheck className="h-5 w-5 text-dsc-yellow" /></div><div><p className="text-2xl font-bold">{purview.labels.total}</p><p className="text-xs text-dsc-text-secondary">Purview Labels · {purview.drift?.unresolved || 0} drift</p></div></div></Card></Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infrastructure Compliance */}
        {infra?.nodes?.total > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-dsc-green" />Infrastructure DSC</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-dsc-text-secondary">Compliance Rate</span><span className="text-lg font-bold text-dsc-green">{infra.compliance.rate}%</span></div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-dsc-green transition-all" style={{ width: `${infra.compliance.rate}%` }} /></div>
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
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cloud className="h-4 w-4 text-dsc-blue" />M365 DSC Workloads</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(m365.workloads as Record<string, { total: number; compliant: number; drifted: number }>).map(([key, wl]) => {
                  const pct = wl.total > 0 ? Math.round((wl.compliant / wl.total) * 100) : 100;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-16 text-dsc-text-secondary">{key}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100"><div className={`h-1.5 rounded-full ${pct === 100 ? "bg-dsc-green" : pct >= 80 ? "bg-dsc-yellow" : "bg-dsc-red"}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs w-8 text-right font-medium">{pct}%</span>
                      {wl.drifted > 0 && <span className="text-[10px] text-dsc-red">{wl.drifted}d</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Registry Summary */}
        {agents?.totals && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-purple-600" />Agent 365 Registry</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-dsc-blue-50"><Shield className="h-4 w-4 text-dsc-blue" /><div><p className="font-bold text-sm">{agents.totals.microsoft}</p><p className="text-[10px] text-dsc-text-secondary">Microsoft</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50"><Activity className="h-4 w-4 text-orange-600" /><div><p className="font-bold text-sm">{agents.totals.external}</p><p className="text-[10px] text-dsc-text-secondary">External</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50"><Bot className="h-4 w-4 text-purple-600" /><div><p className="font-bold text-sm">{agents.totals.custom}</p><p className="text-[10px] text-dsc-text-secondary">Custom</p></div></div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-dsc-green-50"><TrendingUp className="h-4 w-4 text-dsc-green" /><div><p className="font-bold text-sm">{agents.totals.shared}</p><p className="text-[10px] text-dsc-text-secondary">Shared</p></div></div>
              </div>
              <div className="flex gap-4 text-xs text-dsc-text-secondary">
                <span>{agents.totals.deployed} deployed</span>
                <span>{agents.totals.pinned} pinned</span>
                {agents.totals.blocked > 0 && <span className="text-dsc-red">{agents.totals.blocked} blocked</span>}
                {agents.totals.withRisks > 0 && <span className="text-dsc-red">{agents.totals.totalRiskCount} risks</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purview Labels & Drift */}
        {purview?.labels && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-dsc-yellow" />Purview Sensitivity Labels</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                <div><p className="font-bold text-lg">{purview.labels.total}</p><p className="text-dsc-text-secondary">Labels</p></div>
                <div><p className="font-bold text-lg text-dsc-blue">{purview.labels.withProtection}</p><p className="text-dsc-text-secondary">Encrypted</p></div>
                <div><p className="font-bold text-lg text-orange-600">{purview.labels.withEndpointProtection}</p><p className="text-dsc-text-secondary">Endpoint DLP</p></div>
                <div><p className="font-bold text-lg text-dsc-red">{purview.drift?.unresolved || 0}</p><p className="text-dsc-text-secondary">Drift</p></div>
              </div>
              {/* Mini label hierarchy */}
              <div className="space-y-1">
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
              {purview.drift?.unresolved > 0 && (
                <Link href="/purview" className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-dsc-yellow-50 border border-dsc-yellow/20 text-sm text-dsc-yellow hover:bg-dsc-yellow-50/80">
                  <AlertTriangle className="h-4 w-4" />{purview.drift.unresolved} label drift events ({purview.drift.critical || 0} critical)
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Drift across all sources */}
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
