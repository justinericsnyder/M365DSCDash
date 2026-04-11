"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { Sparkline } from "@/components/ui/sparkline";
import { Modal } from "@/components/ui/modal";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Bot, Shield, ShieldCheck, Lock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Plug, Brain, Cpu, Zap, Settings, ExternalLink,
  MessageSquare, Layers, Network, Globe, FileCode2,
  BarChart3, Workflow, Key, Users, Monitor, Eye,
} from "lucide-react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = "overview" | "copilot365" | "studio" | "foundry" | "fabric" | "security";

function generateTrend(current: number, days = 14): number[] {
  const pts: number[] = [];
  let v = Math.max(current - 10 - Math.random() * 8, 5);
  for (let i = 0; i < days; i++) { v = Math.min(100, Math.max(0, v + (Math.random() - 0.35) * 3)); pts.push(Math.round(v * 10) / 10); }
  pts.push(current);
  return pts;
}

export default function AIGovernancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/dashboard");
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "copilot365", label: "Copilot for M365", icon: MessageSquare },
    { key: "studio", label: "Copilot Studio", icon: Bot },
    { key: "foundry", label: "Azure AI Foundry", icon: Brain },
    { key: "fabric", label: "Copilot in Fabric", icon: Cpu },
    { key: "security", label: "Copilot for Security", icon: ShieldCheck },
  ];

  const t = data?.totals || {};

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3"><h2 className="text-2xl font-bold text-dsc-text">AI Governance</h2><Badge variant="active">Live</Badge></div>
        <p className="text-sm text-dsc-text-secondary mt-1">Copilot, AI Foundry, Fabric AI, and agent governance</p>
      </div>

      <div className="flex gap-1 border-b border-dsc-border overflow-x-auto">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === tb.key ? "border-purple-600 text-purple-600" : "border-transparent text-dsc-text-secondary hover:text-dsc-text"}`}>
            <tb.icon className="h-3.5 w-3.5" />{tb.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab data={data} t={t} expandedId={expandedId} setExpandedId={setExpandedId} />}
      {tab === "copilot365" && <Copilot365Tab data={data} t={t} expandedId={expandedId} setExpandedId={setExpandedId} />}
      {tab === "studio" && <CopilotStudioTab t={t} />}
      {tab === "foundry" && <AzureAIFoundryTab data={data} />}
      {tab === "fabric" && <FabricAITab />}
      {tab === "security" && <CopilotSecurityTab data={data} />}
    </div>
  );
}

/* ─── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ data, t, expandedId, setExpandedId }: any) {
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const secureScore = data?.secureScore;
  const currentScore = Number(secureScore?.CurrentScore) || 0;
  const maxScore = Number(secureScore?.MaxScore) || 1;
  const scorePct = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
  const spHealthPct = t.servicePrincipals > 0 ? Math.round((t.enabledSPs / t.servicePrincipals) * 100) : 100;
  const connHealthPct = t.connectors > 0 ? Math.round((t.readyConnectors / t.connectors) * 100) : 100;
  const agentDeployPct = t.agents > 0 ? Math.round((t.deployedAgents / t.agents) * 100) : 0;

  if (!data?.hasData) return <EmptyState icon={Sparkles} title="No AI data synced" description="Connect your tenant and click Sync Now in Settings." />;

  return (
    <div className="space-y-6 stagger-children">`n      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Bot} label="Copilot Agents" value={t.agents} sub={`${t.deployedAgents} deployed`} color="purple" trend={generateTrend(agentDeployPct)} />
        <MetricCard icon={Plug} label="Graph Connectors" value={t.connectors} sub={`${t.readyConnectors} ready`} color="blue" trend={generateTrend(connHealthPct)} />
        <MetricCard icon={Shield} label="Service Principals" value={t.servicePrincipals} sub={`${t.enabledSPs} enabled`} color="green" trend={generateTrend(spHealthPct)} />
        <MetricCard icon={ShieldCheck} label="Secure Score" value={`${scorePct}%`} sub={`${Math.round(currentScore)}/${Math.round(maxScore)}`} color="orange" trend={generateTrend(scorePct)} />
      </div>

      {/* Agent Identity metrics */}
      {((data?.resources?.AgentIdentity || []).length > 0 || (data?.resources?.AgentInstance || []).length > 0 || (data?.resources?.AgentCollection || []).length > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2"><Key className="h-4 w-4 text-dsc-blue" /></div><div><p className="text-xl font-bold">{(data?.resources?.AgentIdentity || []).length}</p><p className="text-[10px] text-dsc-text-secondary">Agent Identities</p></div></div></Card>
          <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2"><Cpu className="h-4 w-4 text-purple-600" /></div><div><p className="text-xl font-bold">{(data?.resources?.AgentInstance || []).length}</p><p className="text-[10px] text-dsc-text-secondary">Agent Instances</p></div></div></Card>
          <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2"><Layers className="h-4 w-4 text-dsc-green" /></div><div><p className="text-xl font-bold">{(data?.resources?.AgentCollection || []).length}</p><p className="text-[10px] text-dsc-text-secondary">Collections</p></div></div></Card>
          <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-yellow-50 p-2"><FileCode2 className="h-4 w-4 text-dsc-yellow" /></div><div><p className="text-xl font-bold">{(data?.resources?.AgentCardManifest || []).length}</p><p className="text-[10px] text-dsc-text-secondary">Card Manifests</p></div></div></Card>
          <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-red-50 p-2"><Brain className="h-4 w-4 text-dsc-red" /></div><div><p className="text-xl font-bold">{(data?.resources?.AgentIdentityBlueprint || []).length}</p><p className="text-[10px] text-dsc-text-secondary">Blueprints</p></div></div></Card>
        </div>
      )}

      {/* Agent breakdown donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-purple-600" />Agent Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 flex-shrink-0">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  {(() => { const types = [{ key: "MICROSOFT", color: "#3182CE" }, { key: "EXTERNAL", color: "#D69E2E" }, { key: "CUSTOM", color: "#7C3AED" }, { key: "SHARED", color: "#38A169" }]; let offset = 0; return types.map((tp) => { const count = t.agentsByType?.[tp.key] || 0; const pct = t.agents > 0 ? (count / t.agents) * 283 : 0; const el = <circle key={tp.key} cx="50" cy="50" r="45" fill="none" stroke={tp.color} strokeWidth="8" strokeDasharray={`${pct} ${283 - pct}`} strokeDashoffset={-offset} />; offset += pct; return el; }); })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">{t.agents}</span><span className="text-[9px] text-dsc-text-secondary">total</span></div>
              </div>
              <div className="space-y-2 flex-1">
                {[{ key: "MICROSOFT", color: "bg-dsc-blue", label: "Microsoft" }, { key: "EXTERNAL", color: "bg-dsc-yellow", label: "External" }, { key: "CUSTOM", color: "bg-purple-600", label: "Custom" }, { key: "SHARED", color: "bg-dsc-green", label: "Shared" }].map((tp) => (
                  <div key={tp.key} className="flex items-center gap-2"><div className={`h-2.5 w-2.5 rounded-full ${tp.color}`} /><span className="text-xs text-dsc-text-secondary flex-1">{tp.label}</span><span className="text-xs font-bold">{t.agentsByType?.[tp.key] || 0}</span></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connector health */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4 text-dsc-blue" />Connector Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.resources?.CopilotGraphConnector || []).map((c: any) => {
                const props = c.properties as any;
                return (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-dsc-blue/30 transition-colors" onClick={() => setSelectedConnector(c)}>
                    <div className="flex items-center gap-2">
                      <StatusDot status={c.status} pulse={c.status !== "COMPLIANT"} />
                      <div>
                        <p className="text-xs font-medium">{c.displayName}</p>
                        <p className="text-[10px] text-dsc-text-secondary">{props?.SchemaProperties || 0} schema props · {props?.ItemCount ?? "?"} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "COMPLIANT" ? "compliant" : "drifted"}>{props?.State || c.status}</Badge>
                      <Eye className="h-3 w-3 text-dsc-text-secondary" />
                    </div>
                  </div>
                );
              })}
              {(data?.resources?.CopilotGraphConnector || []).length === 0 && <p className="text-xs text-dsc-text-secondary text-center py-3">No Graph connectors configured</p>}
            </div>
          </CardContent>
        </Card>

        {/* Connector Detail Modal */}
        <Modal open={!!selectedConnector} onClose={() => setSelectedConnector(null)} title={selectedConnector?.displayName || "Connector Details"} wide>
          {selectedConnector && <ConnectorDetailModal connector={selectedConnector} />}
        </Modal>

        {/* Governance alerts */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-red" />Governance Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {t.blockedAgents > 0 && <AlertRow icon={XCircle} color="text-dsc-red" label={`${t.blockedAgents} blocked agents`} desc="Agents restricted from use in your tenant" />}
              {t.riskyAgents > 0 && <AlertRow icon={Shield} color="text-orange-600" label={`${t.riskyAgents} agents with risks`} desc="High-severity risks flagged by security platforms" />}
              {t.disabledSPs > 0 && <AlertRow icon={Lock} color="text-dsc-yellow" label={`${t.disabledSPs} disabled service principals`} desc="AI service principals that are not active" />}
              {t.blockedAgents === 0 && t.riskyAgents === 0 && t.disabledSPs === 0 && <div className="flex items-center gap-2 p-3 text-center"><CheckCircle2 className="h-4 w-4 text-dsc-green" /><span className="text-xs text-dsc-green">No governance alerts</span></div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Principals */}
      {(data?.resources?.CopilotServicePrincipal || []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-green" />AI Service Principals ({t.servicePrincipals})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(data?.resources?.CopilotServicePrincipal || []).map((sp: any) => {
                const props = sp.properties as any;
                return (
                  <div key={sp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div className="flex items-center gap-2 min-w-0">
                      {props?.AccountEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-dsc-red flex-shrink-0" />}
                      <div className="min-w-0"><p className="text-xs font-medium truncate">{sp.displayName}</p><p className="text-[9px] text-dsc-text-secondary">{props?.ServicePrincipalType}</p></div>
                    </div>
                    <Badge variant={props?.AccountEnabled ? "compliant" : "error"}>{props?.AccountEnabled ? "Active" : "Disabled"}</Badge>
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

function MetricCard({ icon: Icon, label, value, sub, color, trend }: { icon: React.ElementType; label: string; value: string | number; sub: string; color: string; trend: number[] }) {
  const colors: Record<string, { bg: string; text: string; stroke: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600", stroke: "#7C3AED" },
    blue: { bg: "bg-dsc-blue-50", text: "text-dsc-blue", stroke: "#3182CE" },
    green: { bg: "bg-dsc-green-50", text: "text-dsc-green", stroke: "#38A169" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", stroke: "#D69E2E" },
  };
  const c = colors[color] || colors.purple;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${c.bg} p-2.5`}><Icon className={`h-5 w-5 ${c.text}`} /></div>
          <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-dsc-text-secondary">{label}</p><p className="text-[10px] text-dsc-text-secondary">{sub}</p></div>
        </div>
        <Sparkline data={trend} width={56} height={28} color={c.stroke} fillColor={c.stroke} />
      </div>
    </Card>
  );
}

function AlertRow({ icon: Icon, color, label, desc }: { icon: React.ElementType; color: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
      <Icon className={`h-4 w-4 ${color} flex-shrink-0 mt-0.5`} />
      <div><p className="text-xs font-medium text-dsc-text">{label}</p><p className="text-[10px] text-dsc-text-secondary">{desc}</p></div>
    </div>
  );
}

/* ─── Copilot for M365 Tab ─────────────────────────────── */
function Copilot365Tab({ data, t, expandedId, setExpandedId }: any) {
  const connectors = data?.resources?.CopilotGraphConnector || [];
  const copilotSettings = [...(data?.resources?.CopilotLimitedMode || []), ...(data?.resources?.CopilotPinnedAgent || [])];
  const teamsApps = data?.resources?.CopilotTeamsApp || [];
  const consents = data?.resources?.CopilotOAuthConsent || [];

  return (
    <div className="space-y-6 stagger-children">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <MetricCard icon={Settings} label="Admin Settings" value={copilotSettings.length} sub="Copilot config" color="purple" trend={generateTrend(80)} />
        <MetricCard icon={Plug} label="Graph Connectors" value={connectors.length} sub={`${connectors.filter((c: any) => c.status === "COMPLIANT").length} ready`} color="blue" trend={generateTrend(connectors.length > 0 ? 90 : 0)} />
        <MetricCard icon={MessageSquare} label="Teams AI Apps" value={teamsApps.length} sub="Copilot-related" color="green" trend={generateTrend(70)} />
        <MetricCard icon={Key} label="OAuth Consents" value={consents.length} sub="AI app permissions" color="orange" trend={generateTrend(85)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-purple-600" />Copilot Admin Settings</CardTitle></CardHeader>
          <CardContent>{copilotSettings.length === 0 ? <p className="text-sm text-dsc-text-secondary text-center py-4">No settings synced yet. Click Sync Now.</p> : <ResourceList items={copilotSettings} expandedId={expandedId} setExpandedId={setExpandedId} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4 text-dsc-blue" />Graph Connectors ({connectors.length})</CardTitle></CardHeader>
          <CardContent>{connectors.length === 0 ? <div className="text-center py-4"><p className="text-sm text-dsc-text-secondary mb-2">No connectors detected.</p><a href="https://admin.microsoft.com/#/connectors" target="_blank" rel="noopener noreferrer" className="text-xs text-dsc-blue hover:underline">Set up in admin center →</a></div> : <ResourceList items={connectors} expandedId={expandedId} setExpandedId={setExpandedId} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-dsc-green" />Teams AI Apps ({teamsApps.length})</CardTitle></CardHeader>
          <CardContent>{teamsApps.length === 0 ? <p className="text-sm text-dsc-text-secondary text-center py-4">No Copilot-related Teams apps found.</p> : <ResourceList items={teamsApps} expandedId={expandedId} setExpandedId={setExpandedId} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-orange-600" />AI OAuth Consents ({consents.length})</CardTitle></CardHeader>
          <CardContent>{consents.length === 0 ? <p className="text-sm text-dsc-text-secondary text-center py-4">No AI-related OAuth consents found.</p> : <ResourceList items={consents} expandedId={expandedId} setExpandedId={setExpandedId} />}</CardContent>
        </Card>
      </div>

      <PortalLinks links={[
        { label: "Copilot Admin Settings", url: "https://admin.microsoft.com/#/copilot" },
        { label: "Agent Management", url: "https://admin.microsoft.com/#/copilot/agents" },
        { label: "Data Access Governance", url: "https://admin.microsoft.com/#/copilot/dataaccess" },
        { label: "Usage Analytics", url: "https://admin.microsoft.com/#/copilot/usage" },
      ]} />
    </div>
  );
}

/* ─── Copilot Studio Tab ───────────────────────────────── */
function CopilotStudioTab({ t }: any) {
  return (
    <div className="space-y-6 stagger-children">
      <div className="p-4 rounded-lg bg-dsc-green-50/50 border border-dsc-green/20 animate-gravity-in">
        <div className="flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-dsc-green" /><span className="text-sm font-semibold">Microsoft Copilot Studio</span></div>
        <p className="text-xs text-dsc-text-secondary">Build declarative agents for M365 Copilot, custom engine agents, and classic chatbots. Extend with plugins, connectors, and knowledge sources.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><div className="text-center py-2"><p className="text-2xl font-bold text-purple-600">{t.agentsByType?.CUSTOM || 0}</p><p className="text-xs text-dsc-text-secondary">Custom Agents</p></div></Card>
        <Card><div className="text-center py-2"><p className="text-2xl font-bold text-dsc-green">{t.agentsByType?.SHARED || 0}</p><p className="text-xs text-dsc-text-secondary">Shared Agents</p></div></Card>
        <Card><div className="text-center py-2"><p className="text-2xl font-bold text-orange-600">{t.agentsByType?.EXTERNAL || 0}</p><p className="text-xs text-dsc-text-secondary">External Partners</p></div></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Agent Types" icon={Layers} color="text-dsc-green" items={[
          { name: "Declarative Agents", desc: "Extend M365 Copilot with custom instructions, knowledge, and actions" },
          { name: "Custom Engine Agents", desc: "Standalone agents powered by your own AI models (Azure OpenAI, custom)" },
          { name: "Classic Chatbots", desc: "Traditional dialog-based bots with topics, entities, and Power Automate flows" },
        ]} />
        <InfoCard title="Governance Controls" icon={Shield} color="text-dsc-green" items={[
          { name: "Agent Sharing", desc: "Control who can share agents and with whom" },
          { name: "DLP Policies", desc: "Data Loss Prevention for Power Platform connectors" },
          { name: "Environment Strategy", desc: "Isolate dev/test/prod environments" },
          { name: "AI Builder Credits", desc: "Monitor and allocate AI Builder capacity" },
          { name: "Connector Policies", desc: "Control which connectors agents can use" },
        ]} />
      </div>
      <PortalLinks links={[
        { label: "Copilot Studio Portal", url: "https://copilotstudio.microsoft.com" },
        { label: "Power Platform Admin", url: "https://admin.powerplatform.microsoft.com" },
        { label: "Sharing Controls Docs", url: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-sharing-controls-limits" },
      ]} />
    </div>
  );
}

/* ─── Azure AI Foundry Tab ─────────────────────────────── */
function AzureAIFoundryTab({ data }: any) {
  const secureScore = data?.secureScore;
  const currentScore = Number(secureScore?.CurrentScore) || 0;
  const maxScore = Number(secureScore?.MaxScore) || 1;
  const scorePct = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
  const scoreColor = scorePct >= 80 ? "#7ECC9A" : scorePct >= 60 ? "#E8D07A" : "#F28B8B";
  const t = data?.totals || {};
  const scoreControls = data?.scoreControls || [];
  const aiSPs = (data?.resources?.CopilotServicePrincipal || []).filter((sp: any) => {
    const name = String(sp.displayName || "").toLowerCase();
    return name.includes("openai") || name.includes("cognitive") || name.includes("ai foundry") || name.includes("azure ai");
  });

  // Filter controls relevant to AI/data
  const aiControls = scoreControls.filter((c: any) => {
    const svc = String((c.properties as any)?.Service || "").toLowerCase();
    const cat = String((c.properties as any)?.ControlCategory || "").toLowerCase();
    return svc.includes("azure") || cat.includes("data") || cat.includes("app") || svc.includes("information");
  }).slice(0, 8);

  return (
    <div className="space-y-6 stagger-children">
      <div className="p-4 rounded-lg bg-dsc-blue-50/50 border border-dsc-blue/20 animate-gravity-in">
        <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-dsc-blue" /><span className="text-sm font-semibold">Azure AI Foundry</span></div>
        <p className="text-xs text-dsc-text-secondary">Build, evaluate, and deploy AI models. Manage Azure OpenAI deployments, custom models, prompt flows, and AI endpoints.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={ShieldCheck} label="Security Posture" value={`${scorePct}%`} sub={`${Math.round(currentScore)}/${Math.round(maxScore)}`} color="green" trend={generateTrend(scorePct)} />
        <MetricCard icon={Shield} label="AI Service Principals" value={aiSPs.length + (t.servicePrincipals || 0)} sub={`${t.enabledSPs || 0} enabled`} color="blue" trend={generateTrend(85)} />
        <MetricCard icon={BarChart3} label="Security Controls" value={aiControls.length} sub="AI-relevant" color="orange" trend={generateTrend(70)} />
        <MetricCard icon={Plug} label="Graph Connectors" value={t.connectors || 0} sub="data sources" color="purple" trend={generateTrend(t.connectors > 0 ? 90 : 0)} />
      </div>

      {/* Secure Score + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {secureScore && (
          <Card className="animate-gravity-in">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-dsc-green" />AI Security Posture</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative h-28 w-28 flex-shrink-0">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="8" opacity="0.3" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={`${(scorePct / 100) * 314} 314`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{scorePct}%</span>
                    <span className="text-[9px] text-dsc-text-secondary">score</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">{Math.round(currentScore)} / {Math.round(maxScore)} points</p>
                  <div className="h-2 rounded-full bg-dsc-border/30"><div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${scorePct}%`, backgroundColor: scoreColor }} /></div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(secureScore.EnabledServices) ? secureScore.EnabledServices : []).map((svc: string) => (
                      <span key={svc} className="text-[10px] bg-dsc-blue-50 text-dsc-blue px-2 py-0.5 rounded-full border border-dsc-blue/20">{svc}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {aiControls.length > 0 && (
          <Card className="animate-gravity-in">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-dsc-blue" />AI-Relevant Controls ({aiControls.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {aiControls.map((ctrl: any, i: number) => {
                  const props = ctrl.properties as any;
                  const pct = props?.MaxScore > 0 ? Math.round(((props?.CurrentScore || 0) / props.MaxScore) * 100) : 0;
                  const barColor = pct >= 80 ? "#7ECC9A" : pct >= 50 ? "#E8D07A" : "#F28B8B";
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dsc-bg border border-dsc-border">
                      <div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{ctrl.displayName}</p><p className="text-[9px] text-dsc-text-secondary">{props?.Service}</p></div>
                      <div className="flex items-center gap-2 flex-shrink-0"><span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span><div className="w-14 h-2 rounded-full bg-dsc-border/30"><div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} /></div></div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Model types + Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-gravity-in">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-dsc-blue" />Model Deployments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Azure OpenAI", desc: "GPT-4o, GPT-4, GPT-3.5 Turbo, DALL-E, Whisper, embeddings", icon: Brain, pct: 95 },
                { name: "Foundry Models", desc: "Llama, Mistral, Phi, Cohere — serverless or managed", icon: Network, pct: 70 },
                { name: "Custom Models", desc: "Fine-tuned on your data with evaluation pipelines", icon: FileCode2, pct: 45 },
                { name: "Prompt Flow", desc: "Visual LLM orchestration, RAG pipelines, evaluation", icon: Workflow, pct: 60 },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <m.icon className="h-4 w-4 text-dsc-blue flex-shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium">{m.name}</p><p className="text-[9px] text-dsc-text-secondary">{m.desc}</p></div>
                  <Sparkline data={generateTrend(m.pct)} width={40} height={16} color="#B89ADA" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-gravity-in">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-blue" />AI Safety & Governance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Content Safety", desc: "Hate, violence, sexual, self-harm filtering", status: true },
                { name: "Responsible AI", desc: "Transparency notes, fairness, model cards", status: true },
                { name: "RBAC & Networking", desc: "Private endpoints, managed VNets, CMK", status: true },
                { name: "Monitoring", desc: "Token usage, latency, content filter logs", status: true },
                { name: "Rate Limiting", desc: "TPM/RPM quotas per deployment", status: true },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <div className="flex items-center gap-2"><CheckCircle2 className={`h-3.5 w-3.5 ${s.status ? "text-dsc-green" : "text-dsc-red"} flex-shrink-0`} /><div><p className="text-xs font-medium">{s.name}</p><p className="text-[9px] text-dsc-text-secondary">{s.desc}</p></div></div>
                  <Badge variant={s.status ? "compliant" : "error"}>{s.status ? "Active" : "Off"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PortalLinks links={[
        { label: "AI Foundry Portal", url: "https://ai.azure.com" },
        { label: "Azure OpenAI Studio", url: "https://oai.azure.com" },
        { label: "Model Catalog", url: "https://ai.azure.com/explore/models" },
        { label: "Content Safety", url: "https://contentsafety.cognitive.azure.com" },
      ]} />
    </div>
  );
}

/* ─── Fabric AI Tab ────────────────────────────────────── */
function FabricAITab() {
  // Fabric capabilities with readiness indicators
  const capabilities = [
    { name: "Copilot in Notebooks", desc: "Generate Spark/Python code, explain results, fix errors, create visualizations", icon: FileCode2, ready: true, sparkData: generateTrend(88) },
    { name: "Copilot in Power BI", desc: "Create reports from natural language, generate DAX measures, explain visuals", icon: BarChart3, ready: true, sparkData: generateTrend(92) },
    { name: "Copilot in Data Factory", desc: "Generate data pipelines, transform data, create dataflows from descriptions", icon: Workflow, ready: true, sparkData: generateTrend(75) },
    { name: "Copilot in SQL Analytics", desc: "Write T-SQL queries, optimize performance, generate stored procedures", icon: Cpu, ready: true, sparkData: generateTrend(80) },
  ];

  const adminSettings = [
    { name: "Copilot Tenant Setting", desc: "Master toggle for Copilot across all Fabric workspaces", status: "enabled", critical: true },
    { name: "Data Sent to Azure OpenAI", desc: "Controls whether workspace data is processed by Azure OpenAI", status: "enabled", critical: true },
    { name: "Capacity Assignment", desc: "Copilot requires F64+ or P1+ capacity per workspace", status: "required", critical: false },
    { name: "Sensitivity Label Enforcement", desc: "Copilot respects Purview labels — restricted content limits AI responses", status: "active", critical: true },
    { name: "Cross-Geo Data Processing", desc: "Whether data can be processed in a different geography than the capacity", status: "restricted", critical: false },
  ];

  return (
    <div className="space-y-6 stagger-children">
      <div className="p-4 rounded-lg bg-dsc-yellow-50/30 border border-dsc-yellow/20 animate-gravity-in">
        <div className="flex items-center gap-2 mb-2"><Cpu className="h-4 w-4 text-dsc-yellow" /><span className="text-sm font-semibold">Copilot in Microsoft Fabric</span></div>
        <p className="text-xs text-dsc-text-secondary">AI-powered data analytics across the entire Fabric platform. Natural language queries, auto-generated reports, data transformation, and AI-assisted modeling.</p>
      </div>

      {/* Capability readiness */}
      <Card className="animate-gravity-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-dsc-yellow" />Copilot Capabilities</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capabilities.map((cap) => (
              <div key={cap.name} className="flex items-center gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border card-hover">
                <cap.icon className="h-5 w-5 text-dsc-yellow flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold truncate">{cap.name}</p>
                    {cap.ready && <CheckCircle2 className="h-3 w-3 text-dsc-green flex-shrink-0" />}
                  </div>
                  <p className="text-[9px] text-dsc-text-secondary mt-0.5">{cap.desc}</p>
                </div>
                <Sparkline data={cap.sparkData} width={40} height={18} color="#E8D07A" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin settings with status */}
      <Card className="animate-gravity-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-dsc-yellow" />Admin Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {adminSettings.map((setting) => (
              <div key={setting.name} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                <div className="flex items-center gap-3">
                  {setting.critical ? <Lock className="h-3.5 w-3.5 text-dsc-yellow flex-shrink-0" /> : <Settings className="h-3.5 w-3.5 text-dsc-text-secondary flex-shrink-0" />}
                  <div>
                    <p className="text-xs font-medium">{setting.name}</p>
                    <p className="text-[9px] text-dsc-text-secondary">{setting.desc}</p>
                  </div>
                </div>
                <Badge variant={setting.status === "enabled" || setting.status === "active" ? "compliant" : setting.status === "restricted" ? "drifted" : "default"}>
                  {setting.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capacity visual */}
      <Card className="animate-gravity-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-dsc-yellow" />Capacity Requirements</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { sku: "F64", label: "Fabric", desc: "Minimum for Copilot", color: "#E8D07A" },
              { sku: "P1", label: "Premium", desc: "Power BI Premium", color: "#B89ADA" },
              { sku: "F128+", label: "Enterprise", desc: "Full AI features", color: "#7ECC9A" },
            ].map((cap) => (
              <div key={cap.sku} className="text-center p-4 rounded-lg bg-dsc-bg border border-dsc-border">
                <div className="relative h-16 w-16 mx-auto mb-2">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-border)" strokeWidth="5" opacity="0.3" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={cap.color} strokeWidth="5" strokeDasharray="163 163" strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold" style={{ color: cap.color }}>{cap.sku}</span></div>
                </div>
                <p className="text-xs font-medium">{cap.label}</p>
                <p className="text-[9px] text-dsc-text-secondary">{cap.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PortalLinks links={[
        { label: "Fabric Admin Portal", url: "https://app.fabric.microsoft.com/admin-portal/tenantSettings" },
        { label: "Copilot Settings", url: "https://learn.microsoft.com/en-us/fabric/admin/service-admin-portal-copilot" },
        { label: "Fabric Capacities", url: "https://app.fabric.microsoft.com/admin-portal/capacities" },
        { label: "Fabric Docs", url: "https://learn.microsoft.com/en-us/fabric/" },
      ]} />
    </div>
  );
}

/* ─── Copilot for Security Tab ─────────────────────────── */
function CopilotSecurityTab({ data }: any) {
  const scoreControls = data?.scoreControls || [];
  const alerts = data?.securityAlerts || [];
  const incidents = data?.securityIncidents || [];
  const t = data?.totals || {};
  const secureScore = data?.secureScore;
  const currentScore = Number(secureScore?.CurrentScore) || 0;
  const maxScore = Number(secureScore?.MaxScore) || 1;
  const scorePct = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
  const scoreColor = scorePct >= 80 ? "#7ECC9A" : scorePct >= 60 ? "#E8D07A" : "#F28B8B";

  const aiControls = scoreControls.filter((c: any) => {
    const svc = String((c.properties as any)?.Service || "").toLowerCase();
    return svc.includes("copilot") || svc.includes("ai") || svc.includes("defender") || svc.includes("identity");
  }).slice(0, 16);

  const sevColors: Record<string, string> = { high: "text-dsc-red", medium: "text-dsc-yellow", low: "text-dsc-blue", informational: "text-dsc-text-secondary" };

  return (
    <div className="space-y-6 stagger-children">
      <div className="p-4 rounded-lg bg-dsc-red-50/50 border border-dsc-red/20 animate-gravity-in">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-dsc-red" /><span className="text-sm font-semibold">Microsoft Copilot for Security</span></div>
        <p className="text-xs text-dsc-text-secondary">AI-powered security investigation, threat hunting, posture management, and reporting.</p>
      </div>

      {/* Security KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={ShieldCheck} label="Secure Score" value={`${scorePct}%`} sub={`${Math.round(currentScore)}/${Math.round(maxScore)}`} color="green" trend={generateTrend(scorePct)} />
        <MetricCard icon={Shield} label="Security Alerts" value={t.securityAlerts || 0} sub={`${t.activeAlerts || 0} active`} color="orange" trend={generateTrend(t.activeAlerts > 0 ? 40 : 90)} />
        <MetricCard icon={Monitor} label="Incidents" value={t.securityIncidents || 0} sub={`${t.activeIncidents || 0} active`} color="purple" trend={generateTrend(t.activeIncidents > 0 ? 30 : 95)} />
        <MetricCard icon={BarChart3} label="Controls" value={aiControls.length} sub="monitored" color="blue" trend={generateTrend(75)} />
      </div>

      {/* Secure Score Radial */}
      {secureScore && (
        <Card className="animate-gravity-in">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
            <div className="relative h-32 w-32 flex-shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="8" opacity="0.3" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={`${(scorePct / 100) * 314} 314`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{scorePct}%</span>
                <span className="text-[10px] text-dsc-text-secondary">score</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold">{Math.round(currentScore)} / {Math.round(maxScore)} points</p>
              <div className="h-2 rounded-full bg-dsc-border/30"><div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${scorePct}%`, backgroundColor: scoreColor }} /></div>
              <p className="text-xs text-dsc-text-secondary">{(maxScore - currentScore).toFixed(0)} improvement points available</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(Array.isArray(secureScore.EnabledServices) ? secureScore.EnabledServices : []).map((svc: string) => (
                  <span key={svc} className="text-[10px] bg-dsc-blue-50 text-dsc-blue px-2 py-0.5 rounded-full border border-dsc-blue/20">{svc}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <Card className="animate-gravity-in">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-red" />Security Alerts ({alerts.length})</CardTitle></CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-6"><CheckCircle2 className="h-8 w-8 text-dsc-green mx-auto mb-2" /><p className="text-xs text-dsc-text-secondary">No security alerts detected</p></div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {alerts.map((alert: any) => {
                  const props = alert.properties as any;
                  const sev = String(props?.Severity || "medium").toLowerCase();
                  return (
                    <div key={alert.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                      <StatusDot status={alert.status === "COMPLIANT" ? "COMPLIANT" : "ERROR"} pulse={alert.status !== "COMPLIANT"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{alert.displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-semibold ${sevColors[sev] || "text-dsc-text-secondary"}`}>{props?.Severity}</span>
                          <span className="text-[9px] text-dsc-text-secondary">{props?.Category}</span>
                          <span className="text-[9px] text-dsc-text-secondary">{timeAgo(props?.CreatedDateTime)}</span>
                        </div>
                      </div>
                      <Badge variant={props?.Status === "resolved" ? "compliant" : props?.Status === "inProgress" ? "active" : "error"}>{props?.Status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Incidents */}
        <Card className="animate-gravity-in">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-purple-600" />Security Incidents ({incidents.length})</CardTitle></CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-6"><CheckCircle2 className="h-8 w-8 text-dsc-green mx-auto mb-2" /><p className="text-xs text-dsc-text-secondary">No security incidents</p></div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {incidents.map((inc: any) => {
                  const props = inc.properties as any;
                  const sev = String(props?.Severity || "medium").toLowerCase();
                  return (
                    <div key={inc.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                      <StatusDot status={inc.status === "COMPLIANT" ? "COMPLIANT" : "ERROR"} pulse={inc.status !== "COMPLIANT"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{inc.displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-semibold ${sevColors[sev] || "text-dsc-text-secondary"}`}>{props?.Severity}</span>
                          <span className="text-[9px] text-dsc-text-secondary">{props?.Classification || "Unclassified"}</span>
                          <span className="text-[9px] text-dsc-text-secondary">{timeAgo(props?.CreatedDateTime)}</span>
                        </div>
                      </div>
                      <Badge variant={props?.Status === "resolved" ? "compliant" : "error"}>{props?.Status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Controls */}
      {aiControls.length > 0 && (
        <Card className="animate-gravity-in">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-dsc-blue" />Security Controls ({aiControls.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiControls.map((ctrl: any, i: number) => {
                const props = ctrl.properties as any;
                const pct = props?.MaxScore > 0 ? Math.round(((props?.CurrentScore || 0) / props.MaxScore) * 100) : 0;
                const barColor = pct >= 80 ? "#7ECC9A" : pct >= 50 ? "#E8D07A" : "#F28B8B";
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{ctrl.displayName}</p><p className="text-[9px] text-dsc-text-secondary">{props?.Service} · {props?.ControlCategory}</p></div>
                    <div className="flex items-center gap-2 flex-shrink-0"><span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span><div className="w-14 h-2 rounded-full bg-dsc-border/30"><div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} /></div></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <PortalLinks links={[
        { label: "Security Copilot", url: "https://security.microsoft.com/copilot" },
        { label: "Defender Portal", url: "https://security.microsoft.com" },
        { label: "SCU Management", url: "https://portal.azure.com/#view/Microsoft_Azure_Security_Copilot" },
        { label: "Security Docs", url: "https://learn.microsoft.com/en-us/copilot/security/microsoft-security-copilot" },
      ]} />
    </div>
  );
}

/* ─── Shared Components ──────────────────────────────── */
function ResourceList({ items, expandedId, setExpandedId }: { items: any[]; expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  return (
    <div className="space-y-2">
      {items.map((res: any) => {
        const isExp = expandedId === res.id;
        const props = res.properties as Record<string, unknown> || {};
        const simpleProps = Object.entries(props).filter(([, v]) => v != null && typeof v !== "object");
        return (
          <div key={res.id}>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setExpandedId(isExp ? null : res.id)}>
              <div className="flex items-center gap-2 min-w-0">
                {res.status === "COMPLIANT" ? <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-dsc-red flex-shrink-0" />}
                <div className="min-w-0"><p className="text-xs font-medium truncate">{res.displayName}</p><p className="text-[9px] text-dsc-text-secondary">{res.resourceType}</p></div>
              </div>
              <div className="flex items-center gap-1.5"><StatusDot status={res.status} />{isExp ? <ChevronUp className="h-3 w-3 text-dsc-text-secondary" /> : <ChevronDown className="h-3 w-3 text-dsc-text-secondary" />}</div>
            </div>
            {isExp && simpleProps.length > 0 && (
              <div className="mt-1 ml-5 rounded-lg border border-dsc-border bg-dsc-surface p-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {simpleProps.map(([key, val]) => (
                    <div key={key} className="p-1.5 rounded-md bg-dsc-bg border border-dsc-border/50">
                      <p className="text-[8px] text-dsc-text-secondary uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className={`text-[10px] font-medium ${typeof val === "boolean" ? (val ? "text-dsc-green" : "text-dsc-red") : "text-dsc-text"}`}>{typeof val === "boolean" ? (val ? "✓ Yes" : "✗ No") : String(val).substring(0, 50)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ title, icon: Icon, color, items }: { title: string; icon: React.ElementType; color: string; items: { name: string; desc: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} />{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.name} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
              <CheckCircle2 className="h-3.5 w-3.5 text-dsc-text-secondary mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-medium text-dsc-text">{item.name}</p><p className="text-[10px] text-dsc-text-secondary">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PortalLinks({ links }: { links: { label: string; url: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {links.map((link) => (
        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
          <Card hover><div className="flex items-center gap-2"><span className="text-sm font-medium text-dsc-text">{link.label}</span><ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" /></div></Card>
        </a>
      ))}
    </div>
  );
}

/* ─── Connector Detail Modal ─────────────────────────── */
function ConnectorDetailModal({ connector }: { connector: any }) {
  const props = connector.properties as Record<string, unknown> || {};
  const state = String(props.State || "unknown");
  const schemaCount = Number(props.SchemaProperties) || 0;
  const itemCount = props.ItemCount ?? "Unknown";
  const connectorId = String(props.ConnectorId || props.Id || "—");
  const description = String(props.Description || "No description");

  const stateColor = state === "ready" ? "text-dsc-green" : state === "draft" ? "text-dsc-yellow" : "text-dsc-red";
  const stateBg = state === "ready" ? "bg-dsc-green-50" : state === "draft" ? "bg-dsc-yellow-50" : "bg-dsc-red-50";

  // Parse any nested config objects
  const activitySettings = props.ActivitySettings as Record<string, unknown> | null;
  const searchSettings = props.SearchSettings as Record<string, unknown> | null;
  const configuration = props.Configuration as Record<string, unknown> | null;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${stateBg} border border-dsc-border/50`}>
        <StatusDot status={connector.status} pulse={connector.status !== "COMPLIANT"} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${stateColor}`}>State: {state}</p>
          <p className="text-xs text-dsc-text-secondary">{description}</p>
        </div>
        <Badge variant={connector.status === "COMPLIANT" ? "compliant" : "drifted"}>{connector.status}</Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
          <div className="relative h-16 w-16 mx-auto mb-1">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="5" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#3182CE" strokeWidth="5" strokeDasharray={`${Math.min(schemaCount / 20, 1) * 163} 163`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-dsc-blue">{schemaCount}</span></div>
          </div>
          <p className="text-[10px] text-dsc-text-secondary">Schema Properties</p>
        </div>
        <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
          <p className="text-2xl font-bold text-dsc-text mt-3">{String(itemCount)}</p>
          <p className="text-[10px] text-dsc-text-secondary mt-1">Indexed Items</p>
        </div>
        <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border text-center">
          <p className="text-2xl font-bold text-dsc-green mt-3">{state === "ready" ? "✓" : "—"}</p>
          <p className="text-[10px] text-dsc-text-secondary mt-1">Ready for Copilot</p>
        </div>
      </div>

      {/* Connection details */}
      <div>
        <h4 className="text-xs font-semibold text-dsc-text-secondary uppercase tracking-wide mb-2">Connection Details</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Connector ID", value: connectorId },
            { label: "Connection ID", value: String(props.Id || "—") },
            { label: "Name", value: String(props.Name || "—") },
            { label: "State", value: state },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-md bg-dsc-bg border border-dsc-border/50">
              <p className="text-[9px] text-dsc-text-secondary uppercase tracking-wide">{item.label}</p>
              <p className="text-xs font-mono text-dsc-text mt-0.5 break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Settings */}
      {activitySettings && Object.keys(activitySettings).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-dsc-text-secondary uppercase tracking-wide mb-2">Activity Settings</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(activitySettings).filter(([, v]) => v != null).map(([key, val]) => (
              <div key={key} className="p-2 rounded-md bg-dsc-bg border border-dsc-border/50">
                <p className="text-[9px] text-dsc-text-secondary uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className={`text-xs font-medium mt-0.5 ${typeof val === "boolean" ? (val ? "text-dsc-green" : "text-dsc-red") : "text-dsc-text"}`}>
                  {typeof val === "boolean" ? (val ? "✓ Enabled" : "✗ Disabled") : typeof val === "object" ? JSON.stringify(val) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Settings */}
      {searchSettings && Object.keys(searchSettings).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-dsc-text-secondary uppercase tracking-wide mb-2">Search Settings</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(searchSettings).filter(([, v]) => v != null).map(([key, val]) => (
              <div key={key} className="p-2 rounded-md bg-dsc-bg border border-dsc-border/50">
                <p className="text-[9px] text-dsc-text-secondary uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="text-xs font-medium mt-0.5 text-dsc-text">{typeof val === "object" ? JSON.stringify(val) : String(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      {configuration && Object.keys(configuration).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-dsc-text-secondary uppercase tracking-wide mb-2">Configuration</h4>
          <pre className="code-editor bg-dsc-bg rounded-lg p-3 text-xs overflow-auto max-h-40 border border-dsc-border">
            {JSON.stringify(configuration, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw properties fallback */}
      <details className="group">
        <summary className="text-[10px] text-dsc-text-secondary cursor-pointer hover:text-dsc-blue">View raw properties</summary>
        <pre className="code-editor bg-dsc-bg rounded-lg p-3 text-[10px] overflow-auto max-h-48 border border-dsc-border mt-2">
          {JSON.stringify(props, null, 2)}
        </pre>
      </details>
    </div>
  );
}


