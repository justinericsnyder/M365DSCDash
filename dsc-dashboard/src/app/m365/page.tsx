"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  Cloud,
  Shield,
  Mail,
  Share2,
  Users,
  Lock,
  Smartphone,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Database,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const WORKLOAD_META: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  AAD: { label: "Entra ID (AAD)", icon: Shield, color: "text-dsc-blue", bgColor: "bg-dsc-blue-50" },
  EXO: { label: "Exchange Online", icon: Mail, color: "text-dsc-red", bgColor: "bg-dsc-red-50" },
  SPO: { label: "SharePoint Online", icon: Share2, color: "text-dsc-green", bgColor: "bg-dsc-green-50" },
  TEAMS: { label: "Microsoft Teams", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50" },
  SC: { label: "Security & Compliance", icon: Lock, color: "text-dsc-yellow", bgColor: "bg-dsc-yellow-50" },
  INTUNE: { label: "Intune", icon: Smartphone, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  DEFENDER: { label: "Defender", icon: ShieldCheck, color: "text-orange-600", bgColor: "bg-orange-50" },
  OD: { label: "OneDrive", icon: HardDrive, color: "text-dsc-blue", bgColor: "bg-dsc-blue-50" },
};

interface DashboardData {
  hasTenant: boolean;
  tenant?: {
    id: string;
    displayName: string;
    tenantName: string;
    defaultDomain: string;
    lastExport: string;
    lastDriftCheck: string;
  };
  totals?: { resources: number; compliant: number; drifted: number; complianceRate: number };
  workloads?: Record<string, { total: number; compliant: number; drifted: number }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  driftedResources?: any[];
  resourceTypes?: { type: string; count: number }[];
}

export default function M365Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/m365/dashboard");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/m365/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Loaded ${json.summary.resources} M365 resources across ${json.summary.workloads} workloads`);
        fetchData();
      } else {
        toast.error(json.error || "Seed failed");
      }
    } catch {
      toast.error("Failed to seed M365 data");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
      </div>
    );
  }

  if (!data?.hasTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-dsc-blue-50 p-6 mb-6">
          <Cloud className="h-12 w-12 text-dsc-blue" />
        </div>
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Microsoft 365 DSC</h2>
        <p className="text-dsc-text-secondary max-w-lg mb-8">
          Import your Microsoft365DSC export to visualize tenant configuration compliance across
          Entra ID, Exchange, SharePoint, Teams, Intune, and more.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleSeed} disabled={seeding} size="lg">
            <Database className="h-4 w-4" />
            {seeding ? "Loading..." : "Load Demo Tenant"}
          </Button>
          <Link href="/m365/import">
            <Button variant="outline" size="lg">Import JSON Report</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { tenant, totals, workloads, driftedResources } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-dsc-text">Microsoft 365 DSC</h2>
            <Badge variant="active">{tenant?.displayName}</Badge>
          </div>
          <p className="text-sm text-dsc-text-secondary mt-1">
            {tenant?.tenantName} · Last export {timeAgo(tenant?.lastExport)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/m365/resources">
            <Button variant="outline">View All Resources</Button>
          </Link>
          <Link href="/m365/import">
            <Button variant="outline">Import Report</Button>
          </Link>
          <Button onClick={handleSeed} disabled={seeding} variant="ghost" size="icon">
            <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-blue-50 p-2.5">
              <Cloud className="h-5 w-5 text-dsc-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-text">{totals?.resources}</p>
              <p className="text-xs text-dsc-text-secondary">Total Resources</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-green-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-dsc-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-green">{totals?.complianceRate}%</p>
              <p className="text-xs text-dsc-text-secondary">Compliance Rate</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-green-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-dsc-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-text">{totals?.compliant}</p>
              <p className="text-xs text-dsc-text-secondary">Compliant</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-red-50 p-2.5">
              <XCircle className="h-5 w-5 text-dsc-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-red">{totals?.drifted}</p>
              <p className="text-xs text-dsc-text-secondary">Drifted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workload Cards */}
      <div>
        <h3 className="text-lg font-semibold text-dsc-text mb-3">Workload Compliance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(workloads || {}).map(([key, wl]) => {
            const meta = WORKLOAD_META[key] || { label: key, icon: Cloud, color: "text-dsc-text-secondary", bgColor: "bg-dsc-bg" };
            const Icon = meta.icon;
            const pct = wl.total > 0 ? Math.round((wl.compliant / wl.total) * 100) : 100;
            return (
              <Link key={key} href={`/m365/resources?workload=${key}`}>
                <Card hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg ${meta.bgColor} p-2`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dsc-text">{meta.label}</p>
                        <p className="text-xs text-dsc-text-secondary">{wl.total} resources</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-dsc-text-secondary" />
                  </div>
                  <div className="h-2 rounded-full bg-dsc-border/30">
                    <div
                      className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-dsc-green" : pct >= 80 ? "bg-dsc-yellow" : "bg-dsc-red"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-dsc-text-secondary">{pct}% compliant</span>
                    {wl.drifted > 0 && (
                      <span className="text-dsc-red font-medium">{wl.drifted} drifted</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Drifted Resources */}
      {driftedResources && driftedResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-dsc-red" />
              Configuration Drift ({driftedResources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {driftedResources.map((res) => {
                const meta = WORKLOAD_META[res.workload] || WORKLOAD_META.AAD;
                const Icon = meta.icon;
                return (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border"
                  >
                    <div className="flex items-center gap-3">
                      <StatusDot status="DRIFTED" pulse />
                      <div className={`rounded-md ${meta.bgColor} p-1.5`}>
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-dsc-text">{res.displayName}</p>
                        <p className="text-xs text-dsc-text-secondary">{res.resourceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {res.differingProperties?.map((p: string) => (
                        <Badge key={p} variant="drifted">{p}</Badge>
                      ))}
                      <span className="text-xs text-dsc-text-secondary">{timeAgo(res.lastChecked)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

