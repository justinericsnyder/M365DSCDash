"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Bot, Shield, ShieldCheck, Lock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Plug, Brain, Cpu, Zap, Settings, ExternalLink,
  MessageSquare, Layers, Network, Globe, FileCode2,
  BarChart3, Workflow, Key, Users, Monitor,
} from "lucide-react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = "overview" | "copilot365" | "studio" | "foundry" | "fabric" | "security";

const AI_RESOURCE_TYPES = [
  "CopilotLimitedMode", "CopilotPinnedAgent", "CopilotGraphConnector",
  "CopilotServicePrincipal", "PowerPlatformAISettings",
];

export default function AIGovernancePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [agents, setAgents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resData, agentData] = await Promise.all([
        fetch("/api/m365/resources").then((r) => r.json()).catch(() => []),
        fetch("/api/agents/dashboard").then((r) => r.json()).catch(() => null),
      ]);
      const aiResources = (Array.isArray(resData) ? resData : []).filter((r: any) =>
        AI_RESOURCE_TYPES.includes(r.resourceType) || r.resourceType?.includes("Copilot") || r.resourceType?.includes("AI") || r.displayName?.toLowerCase().includes("copilot")
      );
      setResources(aiResources);
      setAgents(agentData);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;

  const grouped = resources.reduce((acc, r) => { if (!acc[r.resourceType]) acc[r.resourceType] = []; acc[r.resourceType].push(r); return acc; }, {} as Record<string, any[]>);
  const totalAgents = agents?.totals?.total || 0;
  const deployedAgents = agents?.totals?.deployed || 0;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "copilot365", label: "Copilot for M365", icon: MessageSquare },
    { key: "studio", label: "Copilot Studio", icon: Bot },
    { key: "foundry", label: "Azure AI Foundry", icon: Brain },
    { key: "fabric", label: "Copilot in Fabric", icon: Cpu },
    { key: "security", label: "Copilot for Security", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-dsc-text">AI Governance</h2>
          <Badge variant="active">Preview</Badge>
        </div>
        <p className="text-sm text-dsc-text-secondary mt-1">Copilot, AI Foundry, Fabric AI, and agent governance across Microsoft 365 and Azure</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dsc-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-purple-600 text-purple-600" : "border-transparent text-dsc-text-secondary hover:text-dsc-text"}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab resources={resources} grouped={grouped} agents={agents} totalAgents={totalAgents} deployedAgents={deployedAgents} expandedId={expandedId} setExpandedId={setExpandedId} />}
      {tab === "copilot365" && <Copilot365Tab resources={resources} grouped={grouped} agents={agents} expandedId={expandedId} setExpandedId={setExpandedId} />}
      {tab === "studio" && <CopilotStudioTab />}
      {tab === "foundry" && <AzureAIFoundryTab />}
      {tab === "fabric" && <FabricAITab />}
      {tab === "security" && <CopilotSecurityTab />}
    </div>
  );
}

/* ─── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ resources, grouped, agents, totalAgents, deployedAgents, expandedId, setExpandedId }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2.5"><Sparkles className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{resources.length}</p><p className="text-xs text-dsc-text-secondary">AI Resources</p></div></div></Card>
        <Link href="/agents"><Card hover><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2.5"><Bot className="h-5 w-5 text-dsc-green" /></div><div><p className="text-2xl font-bold">{totalAgents}</p><p className="text-xs text-dsc-text-secondary">Copilot Agents</p></div></div></Card></Link>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2.5"><Plug className="h-5 w-5 text-dsc-blue" /></div><div><p className="text-2xl font-bold">{grouped.CopilotGraphConnector?.length || 0}</p><p className="text-xs text-dsc-text-secondary">Graph Connectors</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-dsc-green" /></div><div><p className="text-2xl font-bold">{deployedAgents}</p><p className="text-xs text-dsc-text-secondary">Deployed</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-orange-50 p-2.5"><Shield className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{grouped.CopilotServicePrincipal?.length || 0}</p><p className="text-xs text-dsc-text-secondary">Service Principals</p></div></div></Card>
      </div>

      {/* AI Ecosystem Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Microsoft 365 Copilot", desc: "AI assistant in Word, Excel, PowerPoint, Outlook, Teams. Grounded in your org data via Microsoft Graph.", icon: MessageSquare, color: "bg-purple-50 text-purple-600", url: "https://admin.microsoft.com/#/copilot", status: totalAgents > 0 ? `${totalAgents} agents` : "Configure" },
          { name: "Copilot Studio", desc: "Build declarative agents, custom engine agents, and extend Copilot with plugins, connectors, and knowledge sources.", icon: Bot, color: "bg-dsc-green-50 text-dsc-green", url: "https://copilotstudio.microsoft.com", status: "Portal" },
          { name: "Azure AI Foundry", desc: "Build, evaluate, and deploy AI models. Manage Azure OpenAI, custom models, prompt flows, and AI endpoints.", icon: Brain, color: "bg-dsc-blue-50 text-dsc-blue", url: "https://ai.azure.com", status: "Portal" },
          { name: "Copilot in Fabric", desc: "AI-powered data analytics: natural language queries, notebook generation, report creation, and data transformation.", icon: Cpu, color: "bg-orange-50 text-orange-600", url: "https://app.fabric.microsoft.com", status: "Portal" },
          { name: "Copilot for Security", desc: "AI-powered security investigation, incident response, threat hunting, and posture management across Microsoft Defender.", icon: ShieldCheck, color: "bg-dsc-red-50 text-dsc-red", url: "https://security.microsoft.com/copilot", status: "Portal" },
          { name: "Graph Connectors", desc: "Bring external data into Copilot's knowledge base. Sync or federate content from 1000+ data sources.", icon: Plug, color: "bg-cyan-50 text-cyan-600", url: "https://admin.microsoft.com/#/connectors", status: `${grouped.CopilotGraphConnector?.length || 0} connected` },
        ].map((item) => (
          <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer">
            <Card hover className="h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className={`rounded-md p-1.5 ${item.color.split(" ")[0]}`}><item.icon className={`h-4 w-4 ${item.color.split(" ")[1]}`} /></div>
                <span className="text-sm font-semibold text-dsc-text">{item.name}</span>
                <ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" />
              </div>
              <p className="text-xs text-dsc-text-secondary mb-2">{item.desc}</p>
              <Badge variant={item.status.includes("agent") || item.status.includes("connected") ? "active" : "default"}>{item.status}</Badge>
            </Card>
          </a>
        ))}
      </div>

      {/* Synced AI Resources */}
      {resources.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-600" />Synced AI Configuration ({resources.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resources.map((res: any) => (
                <ResourceRow key={res.id} res={res} expandedId={expandedId} setExpandedId={setExpandedId} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Copilot for M365 Tab ─────────────────────────────── */
function Copilot365Tab({ resources, grouped, agents, expandedId, setExpandedId }: any) {
  const copilotResources = resources.filter((r: any) => r.resourceType === "CopilotLimitedMode" || r.resourceType === "CopilotPinnedAgent" || r.resourceType === "CopilotServicePrincipal");
  const connectors = grouped.CopilotGraphConnector || [];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200/30">
        <div className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-purple-600" /><span className="text-sm font-semibold text-dsc-text">Microsoft 365 Copilot</span></div>
        <p className="text-xs text-dsc-text-secondary">AI assistant integrated across Word, Excel, PowerPoint, Outlook, and Teams. Uses Microsoft Graph to ground responses in your organizational data. Governed through the Microsoft 365 admin center.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Copilot Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-purple-600" />Copilot Admin Settings</CardTitle></CardHeader>
          <CardContent>
            {copilotResources.length === 0 ? (
              <p className="text-sm text-dsc-text-secondary text-center py-4">No Copilot settings synced. Click Sync Now in Settings.</p>
            ) : (
              <div className="space-y-2">{copilotResources.map((res: any) => <ResourceRow key={res.id} res={res} expandedId={expandedId} setExpandedId={setExpandedId} />)}</div>
            )}
          </CardContent>
        </Card>

        {/* Graph Connectors */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4 text-dsc-blue" />Graph Connectors ({connectors.length})</CardTitle></CardHeader>
          <CardContent>
            {connectors.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-dsc-text-secondary mb-2">No Graph connectors detected.</p>
                <a href="https://admin.microsoft.com/#/connectors" target="_blank" rel="noopener noreferrer" className="text-xs text-dsc-blue hover:underline">Set up connectors in admin center →</a>
              </div>
            ) : (
              <div className="space-y-2">{connectors.map((res: any) => <ResourceRow key={res.id} res={res} expandedId={expandedId} setExpandedId={setExpandedId} />)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Summary */}
      {agents?.totals && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-dsc-green" />Agent Registry Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-dsc-blue-50 text-center"><p className="text-lg font-bold">{agents.totals.microsoft || 0}</p><p className="text-[10px] text-dsc-text-secondary">Microsoft</p></div>
              <div className="p-3 rounded-lg bg-orange-50 text-center"><p className="text-lg font-bold">{agents.totals.external || 0}</p><p className="text-[10px] text-dsc-text-secondary">External</p></div>
              <div className="p-3 rounded-lg bg-purple-50 text-center"><p className="text-lg font-bold">{agents.totals.custom || 0}</p><p className="text-[10px] text-dsc-text-secondary">Custom</p></div>
              <div className="p-3 rounded-lg bg-dsc-green-50 text-center"><p className="text-lg font-bold">{agents.totals.shared || 0}</p><p className="text-[10px] text-dsc-text-secondary">Shared</p></div>
            </div>
            <div className="mt-3 text-center"><Link href="/agents" className="text-xs text-dsc-blue hover:underline">View full Agent Registry →</Link></div>
          </CardContent>
        </Card>
      )}

      {/* Key admin links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Copilot Admin Settings", url: "https://admin.microsoft.com/#/copilot", desc: "Manage Copilot features, data access, and user assignments" },
          { label: "Agent Management", url: "https://admin.microsoft.com/#/copilot/agents", desc: "Publish, deploy, pin, and block Copilot agents" },
          { label: "Data Access Governance", url: "https://admin.microsoft.com/#/copilot/dataaccess", desc: "Control what data Copilot can access and how" },
          { label: "Usage Analytics", url: "https://admin.microsoft.com/#/copilot/usage", desc: "Monitor Copilot adoption and usage across your org" },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover className="h-full"><p className="text-sm font-medium text-dsc-text mb-1">{link.label}</p><p className="text-[10px] text-dsc-text-secondary">{link.desc}</p><ExternalLink className="h-3 w-3 text-dsc-text-secondary mt-2" /></Card>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Copilot Studio Tab ───────────────────────────────── */
function CopilotStudioTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-dsc-green-50/50 border border-dsc-green/20">
        <div className="flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-dsc-green" /><span className="text-sm font-semibold text-dsc-text">Microsoft Copilot Studio</span></div>
        <p className="text-xs text-dsc-text-secondary">Low-code platform for building custom AI agents. Create declarative agents for M365 Copilot, custom engine agents with your own AI models, and extend agents with plugins, connectors, and knowledge sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-dsc-green" />Agent Types</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Declarative Agents", desc: "Extend M365 Copilot with custom instructions, knowledge, and actions. Published to the agent registry.", icon: MessageSquare, color: "text-purple-600" },
                { name: "Custom Engine Agents", desc: "Standalone agents powered by your own AI models (Azure OpenAI, custom). Full control over orchestration.", icon: Brain, color: "text-dsc-blue" },
                { name: "Classic Chatbots", desc: "Traditional dialog-based bots with topics, entities, and Power Automate flows.", icon: Bot, color: "text-dsc-green" },
              ].map((type) => (
                <div key={type.name} className="flex items-start gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <type.icon className={`h-4 w-4 ${type.color} mt-0.5 flex-shrink-0`} />
                  <div><p className="text-sm font-medium text-dsc-text">{type.name}</p><p className="text-xs text-dsc-text-secondary">{type.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-dsc-green" />Governance Controls</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Agent Sharing", desc: "Control who can share agents and with whom. Restrict to specific security groups.", icon: Users },
                { name: "DLP Policies", desc: "Data Loss Prevention policies for Power Platform connectors used by agents.", icon: Shield },
                { name: "Environment Strategy", desc: "Manage which environments agents can be created in. Isolate dev/test/prod.", icon: Layers },
                { name: "AI Builder Credits", desc: "Monitor and allocate AI Builder capacity credits across environments.", icon: Zap },
                { name: "Connector Policies", desc: "Control which connectors (HTTP, SQL, custom) agents can use.", icon: Plug },
              ].map((ctrl) => (
                <div key={ctrl.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <ctrl.icon className="h-3.5 w-3.5 text-dsc-text-secondary mt-0.5 flex-shrink-0" />
                  <div><p className="text-xs font-medium text-dsc-text">{ctrl.name}</p><p className="text-[10px] text-dsc-text-secondary">{ctrl.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Copilot Studio Portal", url: "https://copilotstudio.microsoft.com" },
          { label: "Power Platform Admin Center", url: "https://admin.powerplatform.microsoft.com" },
          { label: "Agent Sharing Controls", url: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-sharing-controls-limits" },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover><div className="flex items-center gap-2"><span className="text-sm font-medium text-dsc-text">{link.label}</span><ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" /></div></Card>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Azure AI Foundry Tab ─────────────────────────────── */
function AzureAIFoundryTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-dsc-blue-50/50 border border-dsc-blue/20">
        <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-dsc-blue" /><span className="text-sm font-semibold text-dsc-text">Azure AI Foundry</span></div>
        <p className="text-xs text-dsc-text-secondary">Unified platform for building, evaluating, and deploying AI models. Manage Azure OpenAI deployments, custom models, prompt flows, and AI endpoints. Formerly Azure AI Studio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-dsc-blue" />Model Deployments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Azure OpenAI", desc: "GPT-4o, GPT-4, GPT-3.5 Turbo, DALL-E, Whisper, text-embedding models. Managed deployments with rate limiting and content filtering.", icon: Brain, color: "text-dsc-blue" },
                { name: "Foundry Models", desc: "Open-source and partner models: Llama, Mistral, Phi, Cohere, JAIS. Serverless or managed compute deployments.", icon: Network, color: "text-purple-600" },
                { name: "Custom Models", desc: "Fine-tuned models trained on your data. Managed training jobs with evaluation pipelines.", icon: FileCode2, color: "text-dsc-green" },
                { name: "Prompt Flow", desc: "Visual orchestration of LLM calls, tools, and data. Build RAG pipelines, evaluation flows, and deployment endpoints.", icon: Workflow, color: "text-orange-600" },
              ].map((model) => (
                <div key={model.name} className="flex items-start gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <model.icon className={`h-4 w-4 ${model.color} mt-0.5 flex-shrink-0`} />
                  <div><p className="text-sm font-medium text-dsc-text">{model.name}</p><p className="text-xs text-dsc-text-secondary">{model.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-dsc-blue" />AI Safety & Governance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Content Safety", desc: "Built-in content filtering for hate, violence, sexual, and self-harm categories. Configurable severity thresholds per deployment.", icon: ShieldCheck },
                { name: "Responsible AI", desc: "Transparency notes, fairness assessments, and model cards. Required for production deployments.", icon: Globe },
                { name: "RBAC & Networking", desc: "Azure role-based access control, private endpoints, managed VNets, and customer-managed keys.", icon: Key },
                { name: "Monitoring & Logging", desc: "Azure Monitor integration, token usage tracking, latency metrics, and content filter logs.", icon: BarChart3 },
                { name: "Rate Limiting", desc: "Tokens-per-minute (TPM) and requests-per-minute (RPM) quotas per deployment. Dynamic quota allocation.", icon: Zap },
              ].map((ctrl) => (
                <div key={ctrl.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <ctrl.icon className="h-3.5 w-3.5 text-dsc-text-secondary mt-0.5 flex-shrink-0" />
                  <div><p className="text-xs font-medium text-dsc-text">{ctrl.name}</p><p className="text-[10px] text-dsc-text-secondary">{ctrl.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "AI Foundry Portal", url: "https://ai.azure.com" },
          { label: "Azure OpenAI Studio", url: "https://oai.azure.com" },
          { label: "Model Catalog", url: "https://ai.azure.com/explore/models" },
          { label: "Content Safety", url: "https://contentsafety.cognitive.azure.com" },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover><div className="flex items-center gap-2"><span className="text-sm font-medium text-dsc-text">{link.label}</span><ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" /></div></Card>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Fabric AI Tab ────────────────────────────────────── */
function FabricAITab() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200/30">
        <div className="flex items-center gap-2 mb-2"><Cpu className="h-4 w-4 text-orange-600" /><span className="text-sm font-semibold text-dsc-text">Copilot in Microsoft Fabric</span></div>
        <p className="text-xs text-dsc-text-secondary">AI-powered data analytics across the entire Fabric platform. Natural language queries in notebooks, auto-generated reports, data transformation suggestions, and AI-assisted data modeling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-600" />Copilot Capabilities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Copilot in Notebooks", desc: "Generate code, explain results, fix errors, and create visualizations using natural language in Spark notebooks.", icon: FileCode2 },
                { name: "Copilot in Power BI", desc: "Create reports from natural language, generate DAX measures, explain visuals, and summarize data.", icon: BarChart3 },
                { name: "Copilot in Data Factory", desc: "Generate data pipelines, transform data, and create dataflows using natural language descriptions.", icon: Workflow },
                { name: "Copilot in SQL", desc: "Write and explain T-SQL queries, optimize performance, and generate stored procedures.", icon: Cpu },
              ].map((cap) => (
                <div key={cap.name} className="flex items-start gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <cap.icon className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div><p className="text-sm font-medium text-dsc-text">{cap.name}</p><p className="text-xs text-dsc-text-secondary">{cap.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-orange-600" />Admin Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Copilot Tenant Setting", desc: "Enable or disable Copilot across the entire Fabric tenant. Controls whether users see AI features.", icon: Lock },
                { name: "Data Sent to Azure OpenAI", desc: "Control whether data is sent to Azure OpenAI for Copilot processing. Can be restricted by capacity.", icon: Shield },
                { name: "Capacity Assignment", desc: "Copilot requires F64+ or P1+ capacity. Assign capacities to workspaces that need AI features.", icon: Cpu },
                { name: "Sensitivity Labels", desc: "Copilot respects Purview sensitivity labels. Content with restricted labels may limit Copilot responses.", icon: ShieldCheck },
              ].map((setting) => (
                <div key={setting.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <setting.icon className="h-3.5 w-3.5 text-dsc-text-secondary mt-0.5 flex-shrink-0" />
                  <div><p className="text-xs font-medium text-dsc-text">{setting.name}</p><p className="text-[10px] text-dsc-text-secondary">{setting.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Fabric Admin Portal", url: "https://app.fabric.microsoft.com/admin-portal/tenantSettings" },
          { label: "Copilot Settings Docs", url: "https://learn.microsoft.com/en-us/fabric/admin/service-admin-portal-copilot" },
          { label: "Fabric Capacities", url: "https://app.fabric.microsoft.com/admin-portal/capacities" },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover><div className="flex items-center gap-2"><span className="text-sm font-medium text-dsc-text">{link.label}</span><ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" /></div></Card>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Copilot for Security Tab ─────────────────────────── */
function CopilotSecurityTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-dsc-red-50/50 border border-dsc-red/20">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-dsc-red" /><span className="text-sm font-semibold text-dsc-text">Microsoft Copilot for Security</span></div>
        <p className="text-xs text-dsc-text-secondary">AI-powered security assistant for incident investigation, threat hunting, posture management, and security reporting. Integrates with Microsoft Defender, Sentinel, Intune, Entra, and Purview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-dsc-red" />Capabilities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Incident Investigation", desc: "Summarize incidents, analyze attack chains, identify affected assets, and recommend response actions.", icon: Shield },
                { name: "Threat Hunting", desc: "Generate KQL queries from natural language, search across Defender and Sentinel data, and identify IOCs.", icon: Globe },
                { name: "Posture Management", desc: "Analyze Secure Score, identify misconfigurations, and generate remediation scripts.", icon: BarChart3 },
                { name: "Script Analysis", desc: "Reverse-engineer suspicious scripts, decode obfuscated PowerShell, and explain malware behavior.", icon: FileCode2 },
                { name: "Identity Investigation", desc: "Analyze risky sign-ins, investigate compromised accounts, and review Conditional Access impact.", icon: Users },
              ].map((cap) => (
                <div key={cap.name} className="flex items-start gap-3 p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <cap.icon className="h-4 w-4 text-dsc-red mt-0.5 flex-shrink-0" />
                  <div><p className="text-sm font-medium text-dsc-text">{cap.name}</p><p className="text-xs text-dsc-text-secondary">{cap.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-dsc-red" />Admin Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Security Compute Units (SCUs)", desc: "Copilot for Security is billed per SCU. Provision capacity in Azure and assign to your tenant.", icon: Cpu },
                { name: "Plugin Management", desc: "Enable/disable built-in plugins (Defender, Sentinel, Intune, Entra) and custom plugins.", icon: Plug },
                { name: "Role Assignments", desc: "Copilot Owner and Copilot Contributor roles control who can manage settings and use Copilot.", icon: Key },
                { name: "Data Sharing", desc: "Control whether Copilot data is shared with Microsoft for product improvement.", icon: Lock },
                { name: "Audit Logging", desc: "All Copilot for Security sessions are logged in Microsoft Purview audit logs.", icon: Monitor },
              ].map((setting) => (
                <div key={setting.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                  <setting.icon className="h-3.5 w-3.5 text-dsc-text-secondary mt-0.5 flex-shrink-0" />
                  <div><p className="text-xs font-medium text-dsc-text">{setting.name}</p><p className="text-[10px] text-dsc-text-secondary">{setting.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Security Copilot Portal", url: "https://security.microsoft.com/copilot" },
          { label: "SCU Management", url: "https://portal.azure.com/#view/Microsoft_Azure_Security_Copilot" },
          { label: "Security Copilot Docs", url: "https://learn.microsoft.com/en-us/copilot/security/microsoft-security-copilot" },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover><div className="flex items-center gap-2"><span className="text-sm font-medium text-dsc-text">{link.label}</span><ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" /></div></Card>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared Resource Row Component ──────────────────── */
function ResourceRow({ res, expandedId, setExpandedId }: { res: any; expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  const isExpanded = expandedId === res.id;
  const props = res.properties || {};
  const simpleProps = Object.entries(props).filter(([, v]) => v != null && typeof v !== "object");
  const boolColor = (val: unknown) => val === true ? "text-dsc-green" : val === false ? "text-dsc-red" : "text-dsc-text";

  return (
    <div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setExpandedId(isExpanded ? null : res.id)}>
        <div className="flex items-center gap-2.5">
          {res.status === "COMPLIANT" ? <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-dsc-red flex-shrink-0" />}
          <div>
            <p className="text-sm font-medium text-dsc-text">{res.displayName}</p>
            <p className="text-[10px] text-dsc-text-secondary">{res.resourceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={res.status} />
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-dsc-text-secondary" /> : <ChevronDown className="h-3.5 w-3.5 text-dsc-text-secondary" />}
        </div>
      </div>
      {isExpanded && simpleProps.length > 0 && (
        <div className="mt-1.5 ml-6 rounded-lg border border-dsc-border bg-white p-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {simpleProps.map(([key, val]) => (
              <div key={key} className="p-1.5 rounded-md bg-dsc-bg border border-dsc-border/50">
                <p className="text-[9px] text-dsc-text-secondary uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className={`text-xs font-medium ${typeof val === "boolean" ? boolColor(val) : "text-dsc-text"}`}>{typeof val === "boolean" ? (val ? "✓ Enabled" : "✗ Disabled") : String(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
