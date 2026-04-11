"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const WORKLOAD_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  AAD: { label: "Entra ID", icon: Shield, color: "text-dsc-blue" },
  EXO: { label: "Exchange", icon: Mail, color: "text-dsc-red" },
  SPO: { label: "SharePoint", icon: Share2, color: "text-dsc-green" },
  TEAMS: { label: "Teams", icon: Users, color: "text-purple-600" },
  SC: { label: "Security", icon: Lock, color: "text-dsc-yellow" },
  INTUNE: { label: "Intune", icon: Smartphone, color: "text-cyan-600" },
  DEFENDER: { label: "Defender", icon: ShieldCheck, color: "text-orange-600" },
  OD: { label: "OneDrive", icon: HardDrive, color: "text-dsc-blue" },
};

interface M365Resource {
  id: string;
  workload: string;
  resourceType: string;
  displayName: string;
  primaryKey: string | null;
  properties: Record<string, unknown>;
  desiredState: Record<string, unknown> | null;
  actualState: Record<string, unknown> | null;
  status: string;
  differingProperties: string[];
  lastChecked: string | null;
}

export default function M365ResourcesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>}>
      <M365ResourcesContent />
    </Suspense>
  );
}

function M365ResourcesContent() {
  const searchParams = useSearchParams();
  const initialWorkload = searchParams.get("workload") || "";

  const [resources, setResources] = useState<M365Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [workloadFilter, setWorkloadFilter] = useState(initialWorkload);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (workloadFilter) params.set("workload", workloadFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/m365/resources?${params}`);
      const json = await res.json();
      setResources(json);
    } finally {
      setLoading(false);
    }
  }, [workloadFilter, statusFilter, search]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Group by resource type
  const grouped = resources.reduce(
    (acc, r) => {
      const key = `${r.workload}/${r.resourceType}`;
      if (!acc[key]) acc[key] = { workload: r.workload, resourceType: r.resourceType, items: [] };
      acc[key].items.push(r);
      return acc;
    },
    {} as Record<string, { workload: string; resourceType: string; items: M365Resource[] }>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/m365">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to M365 Dashboard
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-dsc-text">M365 Resources</h2>
          <p className="text-sm text-dsc-text-secondary mt-1">
            {resources.length} resources
            {workloadFilter && ` in ${WORKLOAD_META[workloadFilter]?.label || workloadFilter}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dsc-text-secondary" />
          <input
            type="text"
            placeholder="Search resources..."
            className="h-9 w-full rounded-lg border border-dsc-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-dsc-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={workloadFilter}
          onChange={(e) => setWorkloadFilter(e.target.value)}
        >
          <option value="">All Workloads</option>
          {Object.entries(WORKLOAD_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="DRIFTED">Drifted</option>
          <option value="MISSING">Missing</option>
          <option value="ERROR">Error</option>
        </select>
        {(workloadFilter || statusFilter || search) && (
          <button
            className="text-xs text-dsc-blue hover:underline self-center"
            onClick={() => { setWorkloadFilter(""); setStatusFilter(""); setSearch(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Resources */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No M365 resources found"
          description="Import a Microsoft365DSC JSON report or load demo data from the M365 DSC page."
        />
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map((group) => {
            const meta = WORKLOAD_META[group.workload] || { label: group.workload, icon: Cloud, color: "text-gray-600" };
            const Icon = meta.icon;
            const compliant = group.items.filter((r) => r.status === "COMPLIANT").length;

            return (
              <Card key={`${group.workload}/${group.resourceType}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className="font-semibold text-sm text-dsc-text">{group.resourceType}</h3>
                  <Badge variant={group.workload.toLowerCase() === "aad" ? "active" : "default"}>
                    {meta.label}
                  </Badge>
                  <span className="text-xs text-dsc-text-secondary ml-auto">
                    {compliant}/{group.items.length} compliant
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((res) => {
                    const isExpanded = expandedId === res.id;
                    return (
                      <div key={res.id}>
                        <div
                          className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-dsc-blue/30 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : res.id)}
                        >
                          <div className="flex items-center gap-3">
                            {res.status === "COMPLIANT" ? (
                              <CheckCircle2 className="h-4 w-4 text-dsc-green flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-dsc-red flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-sm text-dsc-text">{res.displayName}</p>
                              {res.primaryKey && res.primaryKey !== res.displayName && (
                                <p className="text-xs text-dsc-text-secondary">Key: {res.primaryKey}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {res.differingProperties.length > 0 && (
                              <div className="flex gap-1">
                                {res.differingProperties.map((p) => (
                                  <Badge key={p} variant="drifted">{p}</Badge>
                                ))}
                              </div>
                            )}
                            <StatusDot status={res.status} pulse={res.status !== "COMPLIANT"} />
                            <span className="text-xs text-dsc-text-secondary">{timeAgo(res.lastChecked)}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-dsc-text-secondary" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 ml-7">
                            {res.resourceType === "ODSettings" ? (
                              <OneDriveMetrics properties={res.properties} />
                            ) : res.resourceType === "SecureScore" ? (
                              <SecureScoreMetrics properties={res.properties} />
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-dsc-text-secondary mb-1">
                                    {res.status === "COMPLIANT" ? "Current State" : "Desired State"}
                                  </p>
                                  <pre className="code-editor bg-dsc-green-50 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-dsc-green/20">
                                    {JSON.stringify(res.status === "COMPLIANT" ? res.properties : res.desiredState, null, 2)}
                                  </pre>
                                </div>
                                {res.status !== "COMPLIANT" && (
                                  <div>
                                    <p className="text-xs font-medium text-dsc-text-secondary mb-1">Actual State</p>
                                    <pre className="code-editor bg-dsc-red-50 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-dsc-red/20">
                                      {JSON.stringify(res.actualState, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── OneDrive Metrics Component ─────────────────────── */
function OneDriveMetrics({ properties }: { properties: Record<string, unknown> }) {
  const totalBytes = Number(properties.QuotaTotal) || 0;
  const usedBytes = Number(properties.QuotaUsed) || 0;
  const remainingBytes = Number(properties.QuotaRemaining) || 0;
  const quotaState = String(properties.QuotaState || "unknown");
  const driveType = String(properties.DriveType || "business");

  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const usedGB = usedBytes / (1024 * 1024 * 1024);
  const remainingGB = remainingBytes / (1024 * 1024 * 1024);
  const usedPct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  // Forecast days until full based on estimated daily usage
  const avgDailyUsageGB = usedGB > 0 ? usedGB / 180 : 0.01;
  const daysUntilFull = avgDailyUsageGB > 0 ? Math.round(remainingGB / avgDailyUsageGB) : 9999;
  const forecastDate = new Date(Date.now() + daysUntilFull * 24 * 60 * 60 * 1000);

  const dialColor = usedPct >= 90 ? "#E53E3E" : usedPct >= 70 ? "#D69E2E" : "#38A169";
  const stateColor = quotaState === "normal" ? "text-dsc-green" : quotaState === "nearing" ? "text-dsc-yellow" : "text-dsc-red";
  const stateBg = quotaState === "normal" ? "bg-dsc-green-50" : quotaState === "nearing" ? "bg-dsc-yellow-50" : "bg-dsc-red-50";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(usedPct / 100) * circumference} ${circumference}`;

  return (
    <div className="rounded-xl border border-dsc-border bg-white p-5">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Radial Dial */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div className="relative h-36 w-36">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle cx="64" cy="64" r={radius} fill="none" stroke={dialColor} strokeWidth="10" strokeDasharray={strokeDasharray} strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: dialColor }}>{usedPct.toFixed(1)}%</span>
              <span className="text-[10px] text-dsc-text-secondary">used</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <HardDrive className="h-4 w-4 text-dsc-blue" />
            <span className="text-sm font-semibold text-dsc-text">OneDrive Storage</span>
            <Badge variant={quotaState === "normal" ? "compliant" : quotaState === "nearing" ? "drifted" : "error"}>{quotaState}</Badge>
            <span className="text-xs text-dsc-text-secondary ml-auto">{driveType}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold text-dsc-text">{totalGB.toFixed(1)}</p>
              <p className="text-[10px] text-dsc-text-secondary">Total GB</p>
            </div>
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold" style={{ color: dialColor }}>{usedGB.toFixed(2)}</p>
              <p className="text-[10px] text-dsc-text-secondary">Used GB</p>
            </div>
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold text-dsc-green">{remainingGB.toFixed(1)}</p>
              <p className="text-[10px] text-dsc-text-secondary">Remaining GB</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-dsc-text-secondary mb-1">
              <span>{usedGB.toFixed(2)} GB of {totalGB.toFixed(1)} GB</span>
              <span>{remainingGB.toFixed(1)} GB free</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100">
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(usedPct, 100)}%`, backgroundColor: dialColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Callout */}
      <div className={`mt-4 p-3 rounded-lg ${stateBg} border border-dsc-border/50`}>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {usedPct >= 90 ? <XCircle className="h-4 w-4 text-dsc-red" /> : usedPct >= 70 ? <AlertTriangle className="h-4 w-4 text-dsc-yellow" /> : <CheckCircle2 className="h-4 w-4 text-dsc-green" />}
          </div>
          <div>
            <p className={`text-sm font-medium ${stateColor}`}>{remainingGB.toFixed(1)} GB remaining</p>
            <p className="text-xs text-dsc-text-secondary mt-0.5">
              {daysUntilFull > 365 * 5
                ? "At current usage rates, storage is projected to last well beyond 5 years."
                : daysUntilFull > 365
                  ? `At current usage rates, storage is projected to last approximately ${Math.round(daysUntilFull / 365)} year${Math.round(daysUntilFull / 365) > 1 ? "s" : ""} (until ~${forecastDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}).`
                  : daysUntilFull > 30
                    ? `⚠️ At current usage rates, storage will be full in approximately ${daysUntilFull} days (~${forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}).`
                    : `🚨 Critical: Storage projected to be full in ${daysUntilFull} days (~${forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}). Take action now.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Secure Score Metrics Component ─────────────────── */
function SecureScoreMetrics({ properties }: { properties: Record<string, unknown> }) {
  const currentScore = Number(properties.CurrentScore) || 0;
  const maxScore = Number(properties.MaxScore) || 1;
  const scorePct = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
  const createdDate = properties.CreatedDateTime ? new Date(String(properties.CreatedDateTime)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown";

  // Parse enabled services
  const enabledServices: string[] = Array.isArray(properties.EnabledServices)
    ? properties.EnabledServices.map(String)
    : typeof properties.EnabledServices === "string"
      ? String(properties.EnabledServices).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  // Parse comparative scores
  const comparativeScores: Array<{ basis: string; averageScore: number }> = Array.isArray(properties.AverageComparativeScore)
    ? properties.AverageComparativeScore as Array<{ basis: string; averageScore: number }>
    : [];

  const dialColor = scorePct >= 80 ? "#38A169" : scorePct >= 60 ? "#D69E2E" : "#E53E3E";
  const grade = scorePct >= 80 ? "A" : scorePct >= 60 ? "B" : scorePct >= 40 ? "C" : "D";
  const gradeColor = scorePct >= 80 ? "text-dsc-green" : scorePct >= 60 ? "text-dsc-yellow" : "text-dsc-red";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(scorePct / 100) * circumference} ${circumference}`;

  // Service display names and colors
  const serviceColors: Record<string, string> = {
    "Exchange": "bg-dsc-red-50 text-dsc-red border-dsc-red/20",
    "SharePoint": "bg-dsc-green-50 text-dsc-green border-dsc-green/20",
    "OneDrive": "bg-dsc-blue-50 text-dsc-blue border-dsc-blue/20",
    "Teams": "bg-purple-50 text-purple-600 border-purple-200",
    "AzureAD": "bg-dsc-blue-50 text-dsc-blue border-dsc-blue/20",
    "Intune": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "CloudAppSecurity": "bg-orange-50 text-orange-600 border-orange-200",
    "Defender": "bg-orange-50 text-orange-600 border-orange-200",
    "InformationProtection": "bg-dsc-yellow-50 text-dsc-yellow border-dsc-yellow/20",
  };

  const getServiceStyle = (svc: string) => {
    for (const [key, style] of Object.entries(serviceColors)) {
      if (svc.toLowerCase().includes(key.toLowerCase())) return style;
    }
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <div className="rounded-xl border border-dsc-border bg-white p-5">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Radial Dial */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div className="relative h-36 w-36">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle cx="64" cy="64" r={radius} fill="none" stroke={dialColor} strokeWidth="10" strokeDasharray={strokeDasharray} strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: dialColor }}>{Math.round(currentScore)}</span>
              <span className="text-[10px] text-dsc-text-secondary">of {Math.round(maxScore)}</span>
            </div>
          </div>
        </div>

        {/* Score Details */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-dsc-text">Microsoft Secure Score</span>
            <span className={`text-lg font-bold ${gradeColor}`}>{grade}</span>
            <span className="text-xs text-dsc-text-secondary ml-auto">as of {createdDate}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold" style={{ color: dialColor }}>{Math.round(currentScore)}</p>
              <p className="text-[10px] text-dsc-text-secondary">Current Score</p>
            </div>
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold text-dsc-text">{Math.round(maxScore)}</p>
              <p className="text-[10px] text-dsc-text-secondary">Max Score</p>
            </div>
            <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <p className="text-lg font-bold" style={{ color: dialColor }}>{scorePct.toFixed(1)}%</p>
              <p className="text-[10px] text-dsc-text-secondary">Achievement</p>
            </div>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex justify-between text-[10px] text-dsc-text-secondary mb-1">
              <span>{Math.round(currentScore)} / {Math.round(maxScore)} points</span>
              <span>{(maxScore - currentScore).toFixed(0)} points available</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100">
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(scorePct, 100)}%`, backgroundColor: dialColor }} />
            </div>
          </div>

          {/* Comparative scores */}
          {comparativeScores.length > 0 && (
            <div className="flex gap-3 text-xs">
              {comparativeScores.map((cs, i) => (
                <div key={i} className="flex items-center gap-1.5 text-dsc-text-secondary">
                  <span className="font-medium">{cs.basis}:</span>
                  <span className="font-bold text-dsc-text">{cs.averageScore?.toFixed(1) || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enabled Services */}
      {enabledServices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dsc-border">
          <p className="text-xs font-semibold text-dsc-text-secondary mb-2">Enabled Services ({enabledServices.length})</p>
          <div className="flex flex-wrap gap-2">
            {enabledServices.map((svc) => (
              <span key={svc} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getServiceStyle(svc)}`}>
                {svc.replace(/([A-Z])/g, " $1").trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guidance callout */}
      <div className={`mt-4 p-3 rounded-lg ${scorePct >= 80 ? "bg-dsc-green-50" : scorePct >= 60 ? "bg-dsc-yellow-50" : "bg-dsc-red-50"} border border-dsc-border/50`}>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {scorePct >= 80 ? <CheckCircle2 className="h-4 w-4 text-dsc-green" /> : scorePct >= 60 ? <AlertTriangle className="h-4 w-4 text-dsc-yellow" /> : <XCircle className="h-4 w-4 text-dsc-red" />}
          </div>
          <div>
            <p className={`text-sm font-medium ${gradeColor}`}>
              {scorePct >= 80 ? "Strong security posture" : scorePct >= 60 ? "Room for improvement" : "Significant gaps detected"}
            </p>
            <p className="text-xs text-dsc-text-secondary mt-0.5">
              {scorePct >= 80
                ? `Your score of ${Math.round(currentScore)}/${Math.round(maxScore)} puts you in a strong position. Continue monitoring for new recommendations.`
                : scorePct >= 60
                  ? `${(maxScore - currentScore).toFixed(0)} points available. Review improvement actions in the Microsoft 365 Defender portal to strengthen your posture.`
                  : `${(maxScore - currentScore).toFixed(0)} points available. Prioritize high-impact improvement actions immediately. Visit security.microsoft.com for recommendations.`}
            </p>
            <a href="https://security.microsoft.com/securescore" target="_blank" rel="noopener noreferrer" className="text-xs text-dsc-blue hover:underline mt-1 inline-block">
              View in Microsoft 365 Defender →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
