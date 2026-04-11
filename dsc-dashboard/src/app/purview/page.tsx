"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import {
  ShieldCheck, Shield, Tag, Lock, Unlock, Eye, Monitor,
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Database, Globe, AppWindow, Link2, Ban, Activity, Layers,
} from "lucide-react";
import toast from "react-hot-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = "overview" | "labels" | "scopes" | "drift";

export default function PurviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const [expandedDrift, setExpandedDrift] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/purview/dashboard");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/purview/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Loaded ${json.summary.labels} labels, ${json.summary.protectionScopes} scopes, ${json.summary.driftEvents} drift events`);
        fetchData();
      } else toast.error(json.error);
    } catch { toast.error("Failed to seed"); }
    finally { setSeeding(false); }
  };

  const handleResolve = async (id: string) => {
    await fetch("/api/purview/drift", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true }),
    });
    toast.success("Drift resolved");
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;

  if (!data?.hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-purple-50 p-6 mb-6"><ShieldCheck className="h-12 w-12 text-purple-600" /></div>
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Microsoft Purview</h2>
        <p className="text-dsc-text-secondary max-w-lg mb-2">Sensitivity Labels, Protection Scopes, and Label Drift Monitoring</p>
        <p className="text-xs text-dsc-text-secondary max-w-md mb-8">
          Data sourced from Graph API <code className="bg-dsc-border/30 px-1 rounded">GET /security/dataSecurityAndGovernance/sensitivityLabels</code> and <code className="bg-dsc-border/30 px-1 rounded">POST /users/&#123;id&#125;/dataSecurityAndGovernance/protectionScopes/compute</code>
        </p>
        <Button onClick={handleSeed} disabled={seeding} size="lg"><Database className="h-4 w-4" />{seeding ? "Loading..." : "Load Demo Data"}</Button>
      </div>
    );
  }

  const { labels, protectionScopes: ps, drift, labelHierarchy, recentDrifts, scopes } = data;
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "labels", label: "Sensitivity Labels", count: labels.total },
    { key: "scopes", label: "Protection Scopes", count: ps.total },
    { key: "drift", label: "Label Drift", count: drift.unresolved },
  ];

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-dsc-text">Microsoft Purview</h2>
            <Badge variant="active">{data.tenant.displayName}</Badge>
          </div>
          <p className="text-sm text-dsc-text-secondary mt-1">Sensitivity Labels &middot; Protection Scopes &middot; Drift Monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dsc-border">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-purple-600 text-purple-600" : "border-transparent text-dsc-text-secondary hover:text-dsc-text"}`}>
            {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs bg-dsc-border/30 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab labels={labels} ps={ps} drift={drift} labelHierarchy={labelHierarchy} recentDrifts={recentDrifts} scopes={scopes} onResolve={handleResolve} />}
      {tab === "labels" && <LabelsTab labelHierarchy={labelHierarchy} expandedLabel={expandedLabel} setExpandedLabel={setExpandedLabel} />}
      {tab === "scopes" && <ScopesTab scopes={scopes} />}
      {tab === "drift" && <DriftTab drifts={recentDrifts} expandedDrift={expandedDrift} setExpandedDrift={setExpandedDrift} onResolve={handleResolve} />}
    </div>
  );
}

/* ─── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ labels, ps, drift, labelHierarchy, recentDrifts, scopes, onResolve }: any) {
  return (
    <div className="space-y-6 stagger-children">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2.5"><Tag className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{labels.total}</p><p className="text-xs text-dsc-text-secondary">Total Labels</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-dsc-green" /></div><div><p className="text-2xl font-bold">{labels.enabled}</p><p className="text-xs text-dsc-text-secondary">Enabled</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2.5"><Lock className="h-5 w-5 text-dsc-blue" /></div><div><p className="text-2xl font-bold">{labels.withProtection}</p><p className="text-xs text-dsc-text-secondary">With Encryption</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-orange-50 p-2.5"><Monitor className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{labels.withEndpointProtection}</p><p className="text-xs text-dsc-text-secondary">Endpoint DLP</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-red-50 p-2.5"><AlertTriangle className="h-5 w-5 text-dsc-red" /></div><div><p className="text-2xl font-bold text-dsc-red">{drift.unresolved}</p><p className="text-xs text-dsc-text-secondary">Unresolved Drift</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Label Hierarchy Visual */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-purple-600" />Label Taxonomy ({labels.parents} parent, {labels.sublabels} sub)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {labelHierarchy?.map((label: any) => (
                <div key={label.id}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div className="h-4 w-4 rounded-sm flex-shrink-0" style={{ backgroundColor: label.color || "#718096" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{label.displayName}</span>
                        <span className="text-[10px] text-dsc-text-secondary">P{label.priority}</span>
                        {label.isDefault && <Badge variant="active">Default</Badge>}
                        {!label.isEnabled && <Badge variant="error">Disabled</Badge>}
                        {label.hasProtection && <Lock className="h-3 w-3 text-dsc-blue" />}
                        {label.isEndpointProtectionEnabled && <Monitor className="h-3 w-3 text-orange-500" />}
                      </div>
                    </div>
                    {label._count?.driftEvents > 0 && <Badge variant="drifted">{label._count.driftEvents} drift</Badge>}
                  </div>
                  {label.sublabels?.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {label.sublabels.map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-3 p-2 rounded-md bg-dsc-bg border border-dsc-border/50">
                          <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: sub.color || label.color || "#718096" }} />
                          <span className="text-sm text-dsc-text">{sub.displayName}</span>
                          <span className="text-[10px] text-dsc-text-secondary">P{sub.priority}</span>
                          {!sub.isEnabled && <Badge variant="error">Disabled</Badge>}
                          {sub.hasProtection && <Lock className="h-3 w-3 text-dsc-blue" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {labels.defaultLabel && (
              <div className="mt-4 p-3 rounded-lg bg-dsc-blue-50 border border-dsc-blue/20 text-sm">
                <span className="text-dsc-text-secondary">Default label: </span>
                <span className="font-semibold text-dsc-blue">{labels.defaultLabel.displayName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Protection Scopes Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-blue" />Protection Scopes ({ps.total})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-dsc-red-50 border border-dsc-red/20">
                <Ban className="h-5 w-5 text-dsc-red mx-auto mb-1" />
                <p className="text-lg font-bold text-dsc-red">{ps.blocked}</p>
                <p className="text-[10px] text-dsc-text-secondary">Blocked</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-dsc-blue-50 border border-dsc-blue/20">
                <Activity className="h-5 w-5 text-dsc-blue mx-auto mb-1" />
                <p className="text-lg font-bold text-dsc-blue">{ps.inline}</p>
                <p className="text-[10px] text-dsc-text-secondary">Inline Eval</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-dsc-yellow-50 border border-dsc-yellow/20">
                <Eye className="h-5 w-5 text-dsc-yellow mx-auto mb-1" />
                <p className="text-lg font-bold text-dsc-yellow">{ps.offline}</p>
                <p className="text-[10px] text-dsc-text-secondary">Offline Eval</p>
              </div>
            </div>
            <div className="space-y-2">
              {scopes?.slice(0, 5).map((scope: any) => (
                <div key={scope.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <div className="flex items-center gap-2">
                    {scope.restrictionAction === "block" ? <Ban className="h-3.5 w-3.5 text-dsc-red" /> : scope.executionMode === "evaluateInline" ? <Activity className="h-3.5 w-3.5 text-dsc-blue" /> : <Eye className="h-3.5 w-3.5 text-dsc-yellow" />}
                    <div>
                      <p className="text-xs font-medium">{scope.userDisplayName}</p>
                      <p className="text-[10px] text-dsc-text-secondary">{scope.activities.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {scope.locationType === "policyLocationDomain" && <Globe className="h-3 w-3 text-dsc-text-secondary" />}
                    {scope.locationType === "policyLocationApplication" && <AppWindow className="h-3 w-3 text-dsc-text-secondary" />}
                    {scope.locationType === "policyLocationUrl" && <Link2 className="h-3 w-3 text-dsc-text-secondary" />}
                    <span className="text-[10px] text-dsc-text-secondary truncate max-w-[140px]">{scope.locationValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Drift */}
      {recentDrifts?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-dsc-yellow" />Recent Label Drift ({drift.unresolved} unresolved{drift.critical > 0 && `, ${drift.critical} critical`})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDrifts.slice(0, 8).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <div className="flex items-center gap-3">
                    <StatusDot status={d.severity} pulse={!d.resolved} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{d.label?.displayName}</span>
                        <Badge variant={d.severity.toLowerCase() as any}>{d.severity}</Badge>
                        {d.resolved && <Badge variant="compliant">Resolved</Badge>}
                      </div>
                      <p className="text-xs text-dsc-text-secondary">{d.driftType.replace(/_/g, " ")} — <code className="bg-dsc-border/30 px-1 rounded">{d.field}</code>: {d.previousValue} → {d.currentValue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dsc-text-secondary">{timeAgo(d.detectedAt)}</span>
                    {!d.resolved && <Button variant="success" size="sm" onClick={() => onResolve(d.id)}><CheckCircle2 className="h-3 w-3" />Resolve</Button>}
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

/* ─── Labels Tab ───────────────────────────────────────── */
function LabelsTab({ labelHierarchy, expandedLabel, setExpandedLabel }: any) {
  const applicableIcons: Record<string, string> = { email: "📧", file: "📄", site: "🌐", teamwork: "💬", unifiedGroup: "👥", schematizedData: "🗃️" };
  return (
    <div className="space-y-6 stagger-children">
      <div className="text-sm text-dsc-text-secondary">
        Data from <code className="bg-dsc-border/30 px-1 rounded">GET /security/dataSecurityAndGovernance/sensitivityLabels</code> — full label taxonomy with protection settings, scopes, and application modes.
      </div>
      {labelHierarchy?.map((label: any) => {
        const isExpanded = expandedLabel === label.id;
        return (
          <Card key={label.id}>
            <div className="cursor-pointer" onClick={() => setExpandedLabel(isExpanded ? null : label.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: label.color || "#718096" }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dsc-text">{label.displayName}</h3>
                      <span className="text-xs text-dsc-text-secondary font-mono">P{label.priority} / S{label.sensitivity}</span>
                      {label.isDefault && <Badge variant="active">Default</Badge>}
                      {!label.isEnabled && <Badge variant="error">Disabled</Badge>}
                      {label.hasProtection && <Badge variant="compliant"><Lock className="h-3 w-3 mr-0.5" />Encrypted</Badge>}
                      {label.isEndpointProtectionEnabled && <Badge variant="medium"><Monitor className="h-3 w-3 mr-0.5" />Endpoint DLP</Badge>}
                    </div>
                    <p className="text-xs text-dsc-text-secondary mt-0.5">{label.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">{label.applicableTo?.map((a: string) => <span key={a} title={a} className="text-sm">{applicableIcons[a] || "📋"}</span>)}</div>
                  {label.sublabels?.length > 0 && <span className="text-xs text-dsc-text-secondary">{label.sublabels.length} sublabels</span>}
                  {label._count?.driftEvents > 0 && <Badge variant="drifted">{label._count.driftEvents} drift</Badge>}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-dsc-text-secondary" /> : <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />}
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-dsc-border space-y-4">
                {/* Label Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-dsc-text-secondary">Label ID</p><p className="font-mono text-xs">{label.labelId}</p></div>
                  <div><p className="text-xs text-dsc-text-secondary">Name (internal)</p><p className="font-medium">{label.name}</p></div>
                  <div><p className="text-xs text-dsc-text-secondary">Application Mode</p><Badge variant={label.applicationMode === "automatic" ? "critical" : label.applicationMode === "recommended" ? "medium" : "default"}>{label.applicationMode}</Badge></div>
                  <div><p className="text-xs text-dsc-text-secondary">Action Source</p><p className="font-medium">{label.actionSource}</p></div>
                  <div><p className="text-xs text-dsc-text-secondary">Applicable To</p><div className="flex flex-wrap gap-1 mt-0.5">{label.applicableTo?.map((a: string) => <span key={a} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{a}</span>)}</div></div>
                  <div><p className="text-xs text-dsc-text-secondary">Content Formats</p><div className="flex flex-wrap gap-1 mt-0.5">{label.contentFormats?.map((f: string) => <span key={f} className="text-[10px] bg-dsc-border/30 px-1.5 py-0.5 rounded">{f}</span>)}</div></div>
                  <div><p className="text-xs text-dsc-text-secondary">Has Protection</p><p className="font-medium flex items-center gap-1">{label.hasProtection ? <><Lock className="h-3 w-3 text-dsc-blue" />Yes</> : <><Unlock className="h-3 w-3 text-gray-400" />No</>}</p></div>
                  <div><p className="text-xs text-dsc-text-secondary">Endpoint DLP</p><p className="font-medium flex items-center gap-1">{label.isEndpointProtectionEnabled ? <><Monitor className="h-3 w-3 text-orange-500" />Enabled</> : <><XCircle className="h-3 w-3 text-gray-400" />Disabled</>}</p></div>
                </div>
                {label.tooltip && <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border/50 text-sm text-dsc-text-secondary"><strong>Tooltip:</strong> {label.tooltip}</div>}
                {/* Sublabels */}
                {label.sublabels?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-dsc-text mb-2">Sublabels ({label.sublabels.length})</h4>
                    <div className="space-y-2">
                      {label.sublabels.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: sub.color || label.color }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{sub.displayName}</span>
                                <span className="text-[10px] text-dsc-text-secondary font-mono">P{sub.priority} / S{sub.sensitivity}</span>
                                {sub.isDefault && <Badge variant="active">Default</Badge>}
                                {!sub.isEnabled && <Badge variant="error">Disabled</Badge>}
                                {sub.hasProtection && <Lock className="h-3 w-3 text-dsc-blue" />}
                                {sub.isEndpointProtectionEnabled && <Monitor className="h-3 w-3 text-orange-500" />}
                              </div>
                              <p className="text-xs text-dsc-text-secondary">{sub.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">{sub.applicableTo?.map((a: string) => <span key={a} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{a}</span>)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Scopes Tab ───────────────────────────────────────── */
function ScopesTab({ scopes }: any) {
  const userScopes = scopes?.filter((s: any) => s.userId) || [];
  const tenantScopes = scopes?.filter((s: any) => !s.userId) || [];
  return (
    <div className="space-y-6 stagger-children">
      <div className="text-sm text-dsc-text-secondary">
        Data from <code className="bg-dsc-border/30 px-1 rounded">POST /users/&#123;id&#125;/dataSecurityAndGovernance/protectionScopes/compute</code> — computed DLP policy actions per user, activity, and location.
      </div>
      {/* Tenant-wide scopes */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-dsc-blue" />Tenant-Wide Policies ({tenantScopes.length})</CardTitle></CardHeader>
        <CardContent>
          {tenantScopes.length === 0 ? <p className="text-sm text-dsc-text-secondary text-center py-4">No tenant-wide scopes.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-dsc-border bg-dsc-bg">
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Location</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Type</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Activities</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Execution</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-dsc-border">
                {tenantScopes.map((s: any) => (
                  <tr key={s.id} className="hover:bg-dsc-bg">
                    <td className="py-2.5 px-3 font-medium">{s.locationValue || "All"}</td>
                    <td className="py-2.5 px-3">{s.locationType === "policyLocationDomain" ? <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Domain</span> : s.locationType === "policyLocationUrl" ? <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />URL</span> : <span className="flex items-center gap-1"><AppWindow className="h-3 w-3" />App</span>}</td>
                    <td className="py-2.5 px-3"><div className="flex flex-wrap gap-1">{s.activities.map((a: string) => <span key={a} className="text-[10px] bg-dsc-border/30 px-1.5 py-0.5 rounded">{a}</span>)}</div></td>
                    <td className="py-2.5 px-3"><Badge variant={s.executionMode === "evaluateInline" ? "active" : "medium"}>{s.executionMode === "evaluateInline" ? "Inline" : "Offline"}</Badge></td>
                    <td className="py-2.5 px-3">{s.restrictionAction === "block" ? <Badge variant="error"><Ban className="h-3 w-3 mr-0.5" />Block</Badge> : s.restrictionAction === "audit" ? <Badge variant="medium"><Eye className="h-3 w-3 mr-0.5" />Audit</Badge> : <Badge variant="default">Evaluate</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>
      {/* User-specific scopes */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-purple-600" />User-Specific Scopes ({userScopes.length})</CardTitle></CardHeader>
        <CardContent>
          {userScopes.length === 0 ? <p className="text-sm text-dsc-text-secondary text-center py-4">No user-specific scopes.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-dsc-border bg-dsc-bg">
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">User</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Application</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Activities</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Execution</th>
                <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-dsc-border">
                {userScopes.map((s: any) => (
                  <tr key={s.id} className="hover:bg-dsc-bg">
                    <td className="py-2.5 px-3 font-medium">{s.userDisplayName}</td>
                    <td className="py-2.5 px-3 text-dsc-text-secondary">{s.locationValue || "All"}</td>
                    <td className="py-2.5 px-3"><div className="flex flex-wrap gap-1">{s.activities.map((a: string) => <span key={a} className="text-[10px] bg-dsc-border/30 px-1.5 py-0.5 rounded">{a}</span>)}</div></td>
                    <td className="py-2.5 px-3"><Badge variant={s.executionMode === "evaluateInline" ? "active" : "medium"}>{s.executionMode === "evaluateInline" ? "Inline" : "Offline"}</Badge></td>
                    <td className="py-2.5 px-3">{s.restrictionAction === "block" ? <Badge variant="error"><Ban className="h-3 w-3 mr-0.5" />Block</Badge> : <Badge variant="default">Evaluate</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Drift Tab ────────────────────────────────────────── */
function DriftTab({ drifts, expandedDrift, setExpandedDrift, onResolve }: any) {
  const unresolved = drifts?.filter((d: any) => !d.resolved) || [];
  const resolved = drifts?.filter((d: any) => d.resolved) || [];
  return (
    <div className="space-y-6 stagger-children">
      <div className="text-sm text-dsc-text-secondary">
        Drift detected by comparing sensitivity label snapshots over time. Monitors changes to priority, protection, scope, enablement, and endpoint DLP settings.
      </div>
      {unresolved.length === 0 && resolved.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No drift detected" description="All sensitivity labels are in their expected state." />
      ) : (
        <>
          {unresolved.length > 0 && <DriftSection title="Unresolved" drifts={unresolved} expandedDrift={expandedDrift} setExpandedDrift={setExpandedDrift} onResolve={onResolve} />}
          {resolved.length > 0 && <DriftSection title="Resolved" drifts={resolved} expandedDrift={expandedDrift} setExpandedDrift={setExpandedDrift} onResolve={onResolve} />}
        </>
      )}
    </div>
  );
}

function DriftSection({ title, drifts, expandedDrift, setExpandedDrift, onResolve }: any) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title} ({drifts.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {drifts.map((d: any) => {
            const isExp = expandedDrift === d.id;
            return (
              <div key={d.id}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setExpandedDrift(isExp ? null : d.id)}>
                  <div className="flex items-center gap-3">
                    <StatusDot status={d.severity} pulse={!d.resolved} />
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.label?.color || "#718096" }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{d.label?.displayName}</span>
                        <Badge variant={d.severity.toLowerCase() as any}>{d.severity}</Badge>
                        {d.resolved && <Badge variant="compliant">Resolved</Badge>}
                      </div>
                      <p className="text-xs text-dsc-text-secondary">{d.driftType.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dsc-text-secondary">{timeAgo(d.detectedAt)}</span>
                    {!d.resolved && <Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); onResolve(d.id); }}><CheckCircle2 className="h-3 w-3" />Resolve</Button>}
                    {isExp ? <ChevronUp className="h-4 w-4 text-dsc-text-secondary" /> : <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />}
                  </div>
                </div>
                {isExp && (
                  <div className="ml-6 mt-2 grid grid-cols-3 gap-3">
                    <div><p className="text-xs text-dsc-text-secondary mb-1">Field Changed</p><code className="text-xs bg-dsc-border/30 px-2 py-1 rounded">{d.field}</code></div>
                    <div><p className="text-xs text-dsc-text-secondary mb-1">Previous Value</p><pre className="code-editor bg-dsc-green-50 rounded p-2 text-xs border border-dsc-green/20">{d.previousValue}</pre></div>
                    <div><p className="text-xs text-dsc-text-secondary mb-1">Current Value</p><pre className="code-editor bg-dsc-red-50 rounded p-2 text-xs border border-dsc-red/20">{d.currentValue}</pre></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


