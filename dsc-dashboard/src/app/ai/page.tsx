"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Bot, Shield, Cloud, ShieldCheck, Lock, Eye,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Database,
  Plug, Brain, Cpu, Globe, Zap, Settings, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

const AI_RESOURCE_TYPES = [
  "CopilotLimitedMode", "CopilotPinnedAgent", "CopilotGraphConnector",
  "CopilotServicePrincipal", "PowerPlatformAISettings",
  "SecureScore", "SecureScoreControlProfile",
];

export default function AIGovernancePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [agents, setAgents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resData, agentData] = await Promise.all([
        fetch("/api/m365/resources").then((r) => r.json()).catch(() => []),
        fetch("/api/agents/dashboard").then((r) => r.json()).catch(() => null),
      ]);
      // Filter to AI-related resources
      const aiResources = (Array.isArray(resData) ? resData : []).filter((r: any) =>
        AI_RESOURCE_TYPES.includes(r.resourceType) ||
        r.resourceType?.includes("Copilot") ||
        r.resourceType?.includes("AI") ||
        r.displayName?.toLowerCase().includes("copilot") ||
        r.displayName?.toLowerCase().includes("ai ")
      );
      setResources(aiResources);
      setAgents(agentData);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;

  // Group resources by type
  const grouped = resources.reduce((acc, r) => {
    if (!acc[r.resourceType]) acc[r.resourceType] = [];
    acc[r.resourceType].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  const totalAgents = agents?.totals?.total || 0;
  const deployedAgents = agents?.totals?.deployed || 0;
  const blockedAgents = agents?.totals?.blocked || 0;
  const riskyAgents = agents?.totals?.withRisks || 0;

  const typeLabels: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
    CopilotLimitedMode: { label: "Copilot Limited Mode", icon: Lock, color: "text-dsc-yellow", description: "Controls whether Copilot operates in limited mode for specific groups" },
    CopilotPinnedAgent: { label: "Copilot Pinned Agents", icon: Sparkles, color: "text-purple-600", description: "Agents pinned to the Copilot interface for users" },
    CopilotGraphConnector: { label: "Graph Connectors", icon: Plug, color: "text-dsc-blue", description: "External data sources connected to Microsoft 365 Copilot" },
    CopilotServicePrincipal: { label: "Copilot Service Principals", icon: Shield, color: "text-dsc-green", description: "Azure AD service principals for Copilot services" },
    PowerPlatformAISettings: { label: "Power Platform AI", icon: Zap, color: "text-orange-600", description: "AI Builder and Copilot Studio settings" },
    SecureScore: { label: "AI Security Score", icon: ShieldCheck, color: "text-orange-600", description: "Security posture score including AI-related controls" },
    SecureScoreControlProfile: { label: "Security Controls", icon: Shield, color: "text-dsc-blue", description: "Individual security control recommendations" },
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-dsc-text">AI Governance</h2>
          <Badge variant="active">Preview</Badge>
        </div>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Copilot settings, AI service principals, Graph connectors, and agent governance across Microsoft 365 and Azure
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5"><Sparkles className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{resources.length}</p><p className="text-xs text-dsc-text-secondary">AI Resources</p></div>
          </div>
        </Card>
        <Link href="/agents"><Card hover>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-green-50 p-2.5"><Bot className="h-5 w-5 text-dsc-green" /></div>
            <div><p className="text-2xl font-bold">{totalAgents}</p><p className="text-xs text-dsc-text-secondary">Copilot Agents</p></div>
          </div>
        </Card></Link>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-blue-50 p-2.5"><Plug className="h-5 w-5 text-dsc-blue" /></div>
            <div><p className="text-2xl font-bold">{grouped.CopilotGraphConnector?.length || 0}</p><p className="text-xs text-dsc-text-secondary">Graph Connectors</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-green-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-dsc-green" /></div>
            <div><p className="text-2xl font-bold">{deployedAgents}</p><p className="text-xs text-dsc-text-secondary">Deployed</p></div>
          </div>
        </Card>
        {(blockedAgents > 0 || riskyAgents > 0) && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-dsc-red-50 p-2.5"><XCircle className="h-5 w-5 text-dsc-red" /></div>
              <div><p className="text-2xl font-bold text-dsc-red">{blockedAgents + riskyAgents}</p><p className="text-xs text-dsc-text-secondary">Blocked / Risky</p></div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Copilot Admin Center", url: "https://admin.microsoft.com/#/copilot", icon: Settings },
          { label: "Copilot Studio", url: "https://copilotstudio.microsoft.com", icon: Bot },
          { label: "Azure AI Foundry", url: "https://ai.azure.com", icon: Brain },
          { label: "Fabric AI Settings", url: "https://app.fabric.microsoft.com/admin-portal/tenantSettings", icon: Cpu },
        ].map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card hover className="h-full">
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4 text-dsc-blue" />
                <span className="text-sm font-medium text-dsc-text">{link.label}</span>
                <ExternalLink className="h-3 w-3 text-dsc-text-secondary ml-auto" />
              </div>
            </Card>
          </a>
        ))}
      </div>

      {/* AI Resources by Type */}
      {resources.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No AI resources synced yet"
          description="Connect your Microsoft 365 tenant and click Sync Now in Settings to pull Copilot and AI configuration data."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => {
            const meta = typeLabels[type] || { label: type, icon: Sparkles, color: "text-gray-600", description: "" };
            const Icon = meta.icon;
            const compliant = (items as any[]).filter((r) => r.status === "COMPLIANT").length;

            return (
              <Card key={type}>
                <div className="flex items-center gap-3 mb-1">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className="font-semibold text-sm text-dsc-text">{meta.label}</h3>
                  <span className="text-xs text-dsc-text-secondary">{compliant}/{(items as any[]).length} healthy</span>
                </div>
                {meta.description && <p className="text-xs text-dsc-text-secondary mb-3 ml-7">{meta.description}</p>}

                <div className="space-y-2">
                  {(items as any[]).map((res) => {
                    const isExpanded = expandedId === res.id;
                    const props = res.properties || {};
                    const entries = Object.entries(props).filter(([, v]) => v != null);
                    const simpleProps = entries.filter(([, v]) => typeof v !== "object");
                    const boolColor = (val: unknown) => val === true ? "text-dsc-green" : val === false ? "text-dsc-red" : "text-dsc-text";

                    return (
                      <div key={res.id}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setExpandedId(isExpanded ? null : res.id)}>
                          <div className="flex items-center gap-3">
                            {res.status === "COMPLIANT" ? <CheckCircle2 className="h-4 w-4 text-dsc-green flex-shrink-0" /> : <XCircle className="h-4 w-4 text-dsc-red flex-shrink-0" />}
                            <div>
                              <p className="font-medium text-sm text-dsc-text">{res.displayName}</p>
                              <p className="text-xs text-dsc-text-secondary">{res.workload} · {res.resourceType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {res.differingProperties?.length > 0 && res.differingProperties.map((p: string) => <Badge key={p} variant="drifted">{p}</Badge>)}
                            <StatusDot status={res.status} />
                            <span className="text-xs text-dsc-text-secondary">{timeAgo(res.lastChecked)}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-dsc-text-secondary" /> : <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 ml-7 rounded-lg border border-dsc-border bg-white p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {simpleProps.map(([key, val]) => (
                                <div key={key} className="p-2 rounded-md bg-dsc-bg border border-dsc-border/50">
                                  <p className="text-[9px] text-dsc-text-secondary uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                                  <p className={`text-xs font-medium mt-0.5 ${typeof val === "boolean" ? boolColor(val) : "text-dsc-text"}`}>
                                    {typeof val === "boolean" ? (val ? "✓ Enabled" : "✗ Disabled") : String(val)}
                                  </p>
                                </div>
                              ))}
                            </div>
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

      {/* Copilot Ecosystem Overview */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-purple-600" />Microsoft AI Ecosystem</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "Microsoft 365 Copilot", desc: "AI assistant across Word, Excel, PowerPoint, Outlook, Teams", icon: Sparkles, color: "bg-purple-50 text-purple-600", status: totalAgents > 0 ? "Active" : "Not detected" },
              { name: "Copilot Studio", desc: "Build custom agents and extend Copilot with declarative agents", icon: Bot, color: "bg-dsc-green-50 text-dsc-green", status: "Portal" },
              { name: "Copilot in Fabric", desc: "AI-powered data analytics, notebooks, and report generation", icon: Cpu, color: "bg-orange-50 text-orange-600", status: "Portal" },
              { name: "Azure AI Foundry", desc: "Build, deploy, and manage AI models and endpoints", icon: Brain, color: "bg-dsc-blue-50 text-dsc-blue", status: "Portal" },
              { name: "Copilot for Security", desc: "AI-powered security investigation and incident response", icon: ShieldCheck, color: "bg-dsc-red-50 text-dsc-red", status: "Portal" },
              { name: "Graph Connectors", desc: "Bring external data into Copilot's knowledge base", icon: Plug, color: "bg-cyan-50 text-cyan-600", status: `${grouped.CopilotGraphConnector?.length || 0} connected` },
            ].map((item) => (
              <div key={item.name} className="p-3 rounded-lg border border-dsc-border bg-dsc-bg">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`rounded-md p-1.5 ${item.color.split(" ")[0]}`}><item.icon className={`h-3.5 w-3.5 ${item.color.split(" ")[1]}`} /></div>
                  <span className="text-sm font-semibold text-dsc-text">{item.name}</span>
                </div>
                <p className="text-xs text-dsc-text-secondary mb-2">{item.desc}</p>
                <Badge variant={item.status === "Active" ? "compliant" : item.status.includes("connected") ? "active" : "default"}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
