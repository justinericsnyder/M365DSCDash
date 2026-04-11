"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import {
  Bot,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Pin,
  Ban,
  Rocket,
  Users,
  Building2,
  Share2,
  Search,
  AlertTriangle,
  FileText,
  UserX,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  MICROSOFT: { label: "Microsoft", icon: Shield, color: "text-dsc-blue", bgColor: "bg-dsc-blue-50" },
  EXTERNAL: { label: "External", icon: Building2, color: "text-orange-600", bgColor: "bg-orange-50" },
  CUSTOM: { label: "Custom", icon: Bot, color: "text-purple-600", bgColor: "bg-purple-50" },
  SHARED: { label: "Shared", icon: Share2, color: "text-dsc-green", bgColor: "bg-dsc-green-50" },
};

interface Agent {
  id: string;
  packageId: string;
  displayName: string;
  type: string;
  shortDescription: string | null;
  publisher: string | null;
  isBlocked: boolean;
  supportedHosts: string[];
  elementTypes: string[];
  platform: string | null;
  version: string | null;
  availableTo: string;
  deployedTo: string;
  isPinned: boolean;
  pinnedScope: string | null;
  riskCount: number;
  hasEmbeddedFiles: boolean;
  sensitivityLabel: string | null;
  ownerDisplayName: string | null;
  isOwnerless: boolean;
  lastModifiedDateTime: string | null;
}

interface DashboardData {
  hasTenant: boolean;
  hasAgents?: boolean;
  tenant?: { displayName: string; tenantName: string };
  totals?: {
    total: number; microsoft: number; external: number; custom: number; shared: number;
    blocked: number; deployed: number; pinned: number; withRisks: number;
    totalRiskCount: number; ownerless: number; withEmbeddedFiles: number;
  };
  recentAgents?: Agent[];
}

export default function AgentsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hostFilter, setHostFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "list">("dashboard");

  const fetchDashboard = useCallback(async () => {
    const res = await fetch("/api/agents/dashboard");
    const json = await res.json();
    setDashboard(json);
  }, []);

  const fetchAgents = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter === "blocked") params.set("blocked", "true");
    if (statusFilter === "deployed") params.set("deployed", "deployed");
    if (statusFilter === "not_deployed") params.set("deployed", "not_deployed");
    if (hostFilter) params.set("host", hostFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/agents?${params}`);
    const json = await res.json();
    setAgents(json);
  }, [typeFilter, statusFilter, hostFilter, search]);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAgents()]).finally(() => setLoading(false));
  }, [fetchDashboard, fetchAgents]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/agents/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Loaded ${json.summary.total} agents`);
        await Promise.all([fetchDashboard(), fetchAgents()]);
      } else {
        toast.error(json.error || "Seed failed");
      }
    } catch { toast.error("Failed to seed agents"); }
    finally { setSeeding(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;
  }

  if (!dashboard?.hasAgents) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-purple-50 p-6 mb-6"><Bot className="h-12 w-12 text-purple-600" /></div>
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Agent 365 Registry</h2>
        <p className="text-dsc-text-secondary max-w-lg mb-8">
          View and manage Copilot agents across your tenant — Microsoft, external partner, custom, and shared agents.
          Data sourced from the Graph API <code className="text-xs bg-dsc-border/30 px-1 rounded">GET /beta/copilot/admin/catalog/packages</code>.
        </p>
        <Button onClick={handleSeed} disabled={seeding} size="lg">
          <Database className="h-4 w-4" />{seeding ? "Loading..." : "Load Demo Agents"}
        </Button>
      </div>
    );
  }

  const t = dashboard.totals!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-dsc-text">Agent 365 Registry</h2>
            <Badge variant="active">{dashboard.tenant?.displayName}</Badge>
          </div>
          <p className="text-sm text-dsc-text-secondary mt-1">
            {t.total} agents · via Graph API <code className="text-xs bg-dsc-border/30 px-1 rounded">/beta/copilot/admin/catalog/packages</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "dashboard" ? "primary" : "outline"} size="sm" onClick={() => setView("dashboard")}>Overview</Button>
          <Button variant={view === "list" ? "primary" : "outline"} size="sm" onClick={() => setView("list")}>All Agents</Button>
        </div>
      </div>

      {view === "dashboard" ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon={Bot} label="Total Agents" value={t.total} color="purple" />
            <KPI icon={Rocket} label="Deployed" value={t.deployed} color="blue" />
            <KPI icon={Pin} label="Pinned" value={t.pinned} color="green" />
            <KPI icon={ShieldAlert} label="With Risks" value={t.withRisks} color="red" sub={`${t.totalRiskCount} total risks`} />
          </div>

          {/* Type Breakdown */}
          <div className="grid grid-cols-4 gap-4">
            {(["MICROSOFT", "EXTERNAL", "CUSTOM", "SHARED"] as const).map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              const count = type === "MICROSOFT" ? t.microsoft : type === "EXTERNAL" ? t.external : type === "CUSTOM" ? t.custom : t.shared;
              return (
                <Card key={type} hover className="cursor-pointer" onClick={() => { setTypeFilter(type); setView("list"); }}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg ${meta.bgColor} p-2`}><Icon className={`h-4 w-4 ${meta.color}`} /></div>
                    <div>
                      <p className="text-xl font-bold text-dsc-text">{count}</p>
                      <p className="text-xs text-dsc-text-secondary">{meta.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Governance Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {t.blocked > 0 && (
              <Card className="border-dsc-red/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-dsc-red-50 p-2"><Ban className="h-4 w-4 text-dsc-red" /></div>
                  <div>
                    <p className="font-semibold text-dsc-text">{t.blocked} Blocked</p>
                    <p className="text-xs text-dsc-text-secondary">Agents restricted from use</p>
                  </div>
                </div>
              </Card>
            )}
            {t.ownerless > 0 && (
              <Card className="border-dsc-yellow/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-dsc-yellow-50 p-2"><UserX className="h-4 w-4 text-dsc-yellow" /></div>
                  <div>
                    <p className="font-semibold text-dsc-text">{t.ownerless} Ownerless</p>
                    <p className="text-xs text-dsc-text-secondary">Need ownership reassignment</p>
                  </div>
                </div>
              </Card>
            )}
            {t.withEmbeddedFiles > 0 && (
              <Card>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2"><FileText className="h-4 w-4 text-purple-600" /></div>
                  <div>
                    <p className="font-semibold text-dsc-text">{t.withEmbeddedFiles} With Embedded Files</p>
                    <p className="text-xs text-dsc-text-secondary">Using file knowledge sources</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Recent Agents */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-purple-600" />Recently Modified Agents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard.recentAgents?.slice(0, 8).map((agent) => {
                  const meta = TYPE_META[agent.type] || TYPE_META.CUSTOM;
                  const Icon = meta.icon;
                  return (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-md ${meta.bgColor} p-1.5`}><Icon className={`h-3.5 w-3.5 ${meta.color}`} /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-dsc-text">{agent.displayName}</p>
                            {agent.isBlocked && <Badge variant="error">Blocked</Badge>}
                            {agent.isPinned && <span className="text-dsc-green"><Pin className="h-3 w-3" /></span>}
                          </div>
                          <p className="text-xs text-dsc-text-secondary">{agent.publisher}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.riskCount > 0 && <Badge variant="critical">{agent.riskCount} risks</Badge>}
                        <Badge variant={meta.label.toLowerCase() as "default"}>{meta.label}</Badge>
                        {agent.supportedHosts.map((h) => (
                          <span key={h} className="text-[10px] bg-dsc-border/30 text-dsc-text-secondary px-1.5 py-0.5 rounded">{h}</span>
                        ))}
                        <span className="text-xs text-dsc-text-secondary">{timeAgo(agent.lastModifiedDateTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dsc-text-secondary" />
              <input type="text" placeholder="Search agents..." className="h-9 w-full rounded-lg border border-dsc-border bg-dsc-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-dsc-blue" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="h-9 rounded-lg border border-dsc-border bg-dsc-surface px-3 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="MICROSOFT">Microsoft</option>
              <option value="EXTERNAL">External</option>
              <option value="CUSTOM">Custom</option>
              <option value="SHARED">Shared</option>
            </select>
            <select className="h-9 rounded-lg border border-dsc-border bg-dsc-surface px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="deployed">Deployed</option>
              <option value="not_deployed">Not Deployed</option>
              <option value="blocked">Blocked</option>
            </select>
            <select className="h-9 rounded-lg border border-dsc-border bg-dsc-surface px-3 text-sm" value={hostFilter} onChange={(e) => setHostFilter(e.target.value)}>
              <option value="">All Hosts</option>
              <option value="Copilot">Copilot</option>
              <option value="Teams">Teams</option>
              <option value="Outlook">Outlook</option>
              <option value="Word">Word</option>
              <option value="Excel">Excel</option>
            </select>
            {(typeFilter || statusFilter || hostFilter || search) && (
              <button className="text-xs text-dsc-blue hover:underline self-center" onClick={() => { setTypeFilter(""); setStatusFilter(""); setHostFilter(""); setSearch(""); }}>Clear</button>
            )}
          </div>

          {/* Agent List */}
          {agents.length === 0 ? (
            <EmptyState icon={Bot} title="No agents found" description="Adjust your filters or load demo data." />
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => {
                const meta = TYPE_META[agent.type] || TYPE_META.CUSTOM;
                const Icon = meta.icon;
                const isExpanded = expandedId === agent.id;
                return (
                  <Card key={agent.id}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${meta.bgColor} p-2`}><Icon className={`h-4 w-4 ${meta.color}`} /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-dsc-text">{agent.displayName}</p>
                            {agent.isBlocked && <Badge variant="error">Blocked</Badge>}
                            {agent.isPinned && <span className="text-dsc-green flex items-center gap-0.5 text-xs"><Pin className="h-3 w-3" />Pinned</span>}
                            {agent.isOwnerless && <Badge variant="drifted">Ownerless</Badge>}
                            {agent.riskCount > 0 && <Badge variant="critical"><AlertTriangle className="h-3 w-3 mr-0.5" />{agent.riskCount} risks</Badge>}
                          </div>
                          <p className="text-xs text-dsc-text-secondary">{agent.shortDescription}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {agent.supportedHosts.slice(0, 3).map((h) => (
                            <span key={h} className="text-[10px] bg-dsc-border/30 text-dsc-text-secondary px-1.5 py-0.5 rounded">{h}</span>
                          ))}
                          {agent.supportedHosts.length > 3 && <span className="text-[10px] text-dsc-text-secondary">+{agent.supportedHosts.length - 3}</span>}
                        </div>
                        <Badge variant={meta.label.toLowerCase() as "default"}>{meta.label}</Badge>
                        <div className="text-right text-xs">
                          <p className={agent.deployedTo !== "none" ? "text-dsc-green font-medium" : "text-dsc-text-secondary"}>
                            {agent.deployedTo !== "none" ? `Deployed: ${agent.deployedTo}` : "Not deployed"}
                          </p>
                          <p className="text-dsc-text-secondary">Available: {agent.availableTo}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-dsc-text-secondary" /> : <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-dsc-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-xs text-dsc-text-secondary">Publisher</p><p className="font-medium">{agent.publisher || "—"}</p></div>
                        <div><p className="text-xs text-dsc-text-secondary">Version</p><p className="font-medium">{agent.version || "—"}</p></div>
                        <div><p className="text-xs text-dsc-text-secondary">Platform</p><p className="font-medium">{agent.platform || "web"}</p></div>
                        <div><p className="text-xs text-dsc-text-secondary">Last Modified</p><p className="font-medium">{timeAgo(agent.lastModifiedDateTime)}</p></div>
                        <div><p className="text-xs text-dsc-text-secondary">Element Types</p><div className="flex gap-1 mt-0.5">{agent.elementTypes.map((e) => <span key={e} className="text-[10px] bg-dsc-border/30 px-1.5 py-0.5 rounded">{e}</span>)}</div></div>
                        <div><p className="text-xs text-dsc-text-secondary">Hosts</p><div className="flex flex-wrap gap-1 mt-0.5">{agent.supportedHosts.map((h) => <span key={h} className="text-[10px] bg-dsc-blue-50 text-dsc-blue px-1.5 py-0.5 rounded">{h}</span>)}</div></div>
                        {agent.ownerDisplayName && <div><p className="text-xs text-dsc-text-secondary">Owner</p><p className="font-medium">{agent.ownerDisplayName}</p></div>}
                        {agent.sensitivityLabel && <div><p className="text-xs text-dsc-text-secondary">Sensitivity</p><Badge variant={agent.sensitivityLabel === "Highly Confidential" ? "critical" : agent.sensitivityLabel === "Confidential" ? "high" : "medium"}>{agent.sensitivityLabel}</Badge></div>}
                        {agent.hasEmbeddedFiles && <div><p className="text-xs text-dsc-text-secondary">Knowledge</p><p className="font-medium flex items-center gap-1"><FileText className="h-3 w-3" />Embedded files</p></div>}
                        <div><p className="text-xs text-dsc-text-secondary">Package ID</p><p className="font-mono text-xs text-dsc-text-secondary">{agent.packageId}</p></div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number; color: string; sub?: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    blue: { bg: "bg-dsc-blue-50", text: "text-dsc-blue" },
    green: { bg: "bg-dsc-green-50", text: "text-dsc-green" },
    red: { bg: "bg-dsc-red-50", text: "text-dsc-red" },
  };
  const c = colors[color] || colors.blue;
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${c.bg} p-2.5`}><Icon className={`h-5 w-5 ${c.text}`} /></div>
        <div>
          <p className="text-2xl font-bold text-dsc-text">{value}</p>
          <p className="text-xs text-dsc-text-secondary">{label}</p>
          {sub && <p className="text-[10px] text-dsc-text-secondary">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

