"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  Server,
  FileCode2,
  Blocks,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Shield,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { stats, statsLoading, fetchStats, seedData } = useStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSeed = async () => {
    try {
      await seedData();
      await fetchStats();
      toast.success("Demo data loaded successfully");
    } catch {
      toast.error("Failed to seed data. Make sure the database is connected.");
    }
  };

  if (statsLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
      </div>
    );
  }

  if (!stats || stats.nodes.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-dsc-blue-50 p-6 mb-6">
          <Database className="h-12 w-12 text-dsc-blue" />
        </div>
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Welcome to DSC Dashboard</h2>
        <p className="text-dsc-text-secondary max-w-md mb-8">
          Manage your PowerShell Desired State Configuration v3 resources, nodes, and compliance from one place.
        </p>
        <Button onClick={handleSeed} size="lg">
          <Database className="h-4 w-4" />
          Load Demo Data
        </Button>
        <p className="text-xs text-dsc-text-secondary mt-3">
          Or import your own DSC configuration documents from the Import page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Dashboard</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Overview of your DSC infrastructure compliance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Nodes"
          value={stats.nodes.total}
          icon={Server}
          color="blue"
          subtitle={`${stats.nodes.compliant} compliant`}
        />
        <KPICard
          title="Compliance Rate"
          value={`${stats.compliance.rate}%`}
          icon={Shield}
          color="green"
          subtitle={`${stats.nodes.drifted} drifted`}
        />
        <KPICard
          title="Configurations"
          value={stats.configurations.total}
          icon={FileCode2}
          color="yellow"
          subtitle={`${stats.configurations.active} active`}
        />
        <KPICard
          title="Drift Events"
          value={stats.drift.unresolved}
          icon={AlertTriangle}
          color="red"
          subtitle="unresolved"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-dsc-blue" />
              Node Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusBar label="Compliant" count={stats.nodes.compliant} total={stats.nodes.total} color="bg-dsc-green" />
              <StatusBar label="Drifted" count={stats.nodes.drifted} total={stats.nodes.total} color="bg-dsc-yellow" />
              <StatusBar label="Error" count={stats.nodes.error} total={stats.nodes.total} color="bg-dsc-red" />
              <StatusBar
                label="Other"
                count={stats.nodes.total - stats.nodes.compliant - stats.nodes.drifted - stats.nodes.error}
                total={stats.nodes.total}
                color="bg-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resource Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Blocks className="h-4 w-4 text-dsc-red" />
              Resource Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="#38A169" strokeWidth="10"
                    strokeDasharray={`${(stats.resources.complianceRate / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-dsc-text">{stats.resources.complianceRate}%</span>
                  <span className="text-xs text-dsc-text-secondary">compliant</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green" />
                {stats.resources.compliant} in desired state
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-dsc-red" />
                {stats.resources.total - stats.resources.compliant} drifted
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-dsc-yellow" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <QuickStat label="Total Resources" value={stats.resources.total} />
              <QuickStat label="Active Configurations" value={stats.configurations.active} />
              <QuickStat label="Unresolved Drift" value={stats.drift.unresolved} highlight={stats.drift.unresolved > 0} />
              <QuickStat label="Compliance Score" value={`${stats.compliance.rate}%`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Drift Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-dsc-yellow" />
            Recent Drift Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.drift.recent.length === 0 ? (
            <p className="text-sm text-dsc-text-secondary py-4 text-center">No drift events detected. All systems compliant.</p>
          ) : (
            <div className="divide-y divide-dsc-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {stats.drift.recent.map((event: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <StatusDot status={event.severity} pulse={!event.resolved} />
                    <div>
                      <p className="text-sm font-medium text-dsc-text">
                        {event.node?.name || "Unknown Node"}
                      </p>
                      <p className="text-xs text-dsc-text-secondary">
                        {(event.differingProperties || []).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.severity?.toLowerCase() as "low" | "medium" | "high" | "critical"}>
                      {event.severity}
                    </Badge>
                    <span className="text-xs text-dsc-text-secondary">
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ElementType; color: string; subtitle: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-dsc-blue-50", icon: "text-dsc-blue" },
    green: { bg: "bg-dsc-green-50", icon: "text-dsc-green" },
    yellow: { bg: "bg-dsc-yellow-50", icon: "text-dsc-yellow" },
    red: { bg: "bg-dsc-red-50", icon: "text-dsc-red" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dsc-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-dsc-text mt-1">{value}</p>
          <p className="text-xs text-dsc-text-secondary mt-1">{subtitle}</p>
        </div>
        <div className={`rounded-lg ${c.bg} p-2.5`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </Card>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-dsc-text-secondary">{label}</span>
        <span className="font-medium text-dsc-text">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickStat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-dsc-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-dsc-red" : "text-dsc-text"}`}>{value}</span>
    </div>
  );
}
