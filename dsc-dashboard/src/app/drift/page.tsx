"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import { getExplanation, getGenericExplanation } from "@/lib/drift-explanations";
import {
  AlertTriangle, CheckCircle2, Server, Cloud, ShieldCheck,
  ChevronDown, ChevronUp, Shield, Info, ArrowRight, Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

const sourceIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  infra: { icon: Server, label: "Infrastructure", color: "text-dsc-green" },
  m365: { icon: Cloud, label: "M365 DSC", color: "text-dsc-blue" },
  purview: { icon: ShieldCheck, label: "Purview", color: "text-purple-600" },
};

export default function DriftPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedFilter, setResolvedFilter] = useState("false");
  const [severityFilter, setSeverityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDrift = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (resolvedFilter) params.set("resolved", resolvedFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    fetch(`/api/drift?${params}`).then((r) => r.json()).then(setEvents).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrift(); }, [resolvedFilter, severityFilter, sourceFilter]);

  const handleResolve = async (id: string, source: string) => {
    await fetch("/api/drift", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, resolved: true, source }) });
    toast.success("Drift resolved");
    fetchDrift();
  };

  const sourceCounts = events.reduce((acc, e) => { acc[e.source] = (acc[e.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const severityCounts = events.reduce((acc, e) => { if (!e.resolved) acc[e.severity] = (acc[e.severity] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Drift Events</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">Configuration drift across Infrastructure, M365, and Purview ({events.length} events)</p>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
          const colors: Record<string, { bg: string; text: string }> = {
            CRITICAL: { bg: "bg-dsc-red-50", text: "text-dsc-red" },
            HIGH: { bg: "bg-orange-50", text: "text-orange-600" },
            MEDIUM: { bg: "bg-dsc-yellow-50", text: "text-dsc-yellow" },
            LOW: { bg: "bg-dsc-blue-50", text: "text-dsc-blue" },
          };
          const c = colors[sev];
          return (
            <Card key={sev} hover className="cursor-pointer" onClick={() => setSeverityFilter(severityFilter === sev ? "" : sev)}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${c.bg} p-2`}><Shield className={`h-4 w-4 ${c.text}`} /></div>
                <div><p className={`text-xl font-bold ${c.text}`}>{severityCounts[sev] || 0}</p><p className="text-xs text-dsc-text-secondary">{sev}</p></div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Source + filters */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(sourceCounts).map(([src, count]) => {
          const meta = sourceIcons[src] || sourceIcons.infra;
          const Icon = meta.icon;
          return (
            <button key={src} onClick={() => setSourceFilter(sourceFilter === src ? "" : src)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${sourceFilter === src ? "bg-dsc-blue-50 border-dsc-blue/30 text-dsc-blue" : "bg-white border-dsc-border text-dsc-text-secondary hover:bg-gray-50"}`}>
              <Icon className={`h-3 w-3 ${meta.color}`} />{meta.label} <span className="font-bold">{String(count)}</span>
            </button>
          );
        })}
        <select className="h-8 rounded-lg border border-dsc-border bg-white px-3 text-xs" value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}>
          <option value="false">Unresolved</option><option value="true">Resolved</option><option value="">All</option>
        </select>
        <select className="h-8 rounded-lg border border-dsc-border bg-white px-3 text-xs" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
        </select>
      </div>

      {/* Events */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>
      ) : events.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No drift events" description={resolvedFilter === "false" ? "All systems in desired state." : "No events match filters."} />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isExpanded = expandedId === event.id;
            const meta = sourceIcons[event.source] || sourceIcons.infra;
            const Icon = meta.icon;
            const props = event.differingProperties || [];

            return (
              <Card key={event.id} className={!event.resolved ? "border-l-4 border-l-dsc-red/40" : ""}>
                {/* Header row */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : event.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={event.severity} pulse={!event.resolved} />
                    <Icon className={`h-4 w-4 ${meta.color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{event.targetName}</span>
                        <Badge variant={event.severity.toLowerCase() as any}>{event.severity}</Badge>
                        <Badge variant={event.source === "m365" ? "active" : event.source === "purview" ? "medium" : "default"}>{meta.label}</Badge>
                        {event.resolved && <Badge variant="compliant">Resolved</Badge>}
                      </div>
                      <p className="text-xs text-dsc-text-secondary mt-0.5">
                        {event.resourceType}{event.driftType ? ` · ${event.driftType.replace(/_/g, " ")}` : ""}{event.workload ? ` · ${event.workload}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-dsc-text-secondary hidden sm:inline">{timeAgo(event.createdAt)}</span>
                    {!event.resolved && (
                      <Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); handleResolve(event.id, event.source); }}>
                        <CheckCircle2 className="h-3 w-3" />Resolve
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-dsc-text-secondary" /> : <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />}
                  </div>
                </div>

                {/* What's different — always visible summary */}
                {props.length > 0 && !isExpanded && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {props.map((prop: string) => (
                      <span key={prop} className="inline-flex items-center gap-1 text-xs bg-dsc-red-50 text-dsc-red px-2 py-1 rounded-md border border-dsc-red/20">
                        <AlertTriangle className="h-3 w-3" />{prop}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dsc-border space-y-4">
                    {/* Per-property breakdown */}
                    {props.map((prop: string) => {
                      const explanation = getExplanation(prop) || getGenericExplanation(prop);
                      const desiredVal = event.desiredState?.[prop];
                      const actualVal = event.actualState?.[prop];

                      return (
                        <div key={prop} className="rounded-lg border border-dsc-border overflow-hidden">
                          {/* Property header */}
                          <div className="bg-dsc-bg px-4 py-2.5 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-dsc-red flex-shrink-0" />
                            <span className="font-semibold text-sm text-dsc-text">{explanation.setting}</span>
                            <code className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-mono">{prop}</code>
                          </div>

                          <div className="p-4 space-y-3">
                            {/* What changed — side by side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-lg bg-dsc-green-50 border border-dsc-green/20 p-3">
                                <p className="text-[10px] font-semibold text-dsc-green uppercase tracking-wide mb-1">✓ Desired State</p>
                                <pre className="text-sm font-mono text-dsc-text break-all whitespace-pre-wrap">
                                  {desiredVal !== undefined ? formatValue(desiredVal) : JSON.stringify(event.desiredState, null, 2)}
                                </pre>
                              </div>
                              <div className="rounded-lg bg-dsc-red-50 border border-dsc-red/20 p-3">
                                <p className="text-[10px] font-semibold text-dsc-red uppercase tracking-wide mb-1">✗ Actual State</p>
                                <pre className="text-sm font-mono text-dsc-text break-all whitespace-pre-wrap">
                                  {actualVal !== undefined ? formatValue(actualVal) : JSON.stringify(event.actualState, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Arrow showing the drift direction */}
                            {desiredVal !== undefined && actualVal !== undefined && (
                              <div className="flex items-center gap-2 text-sm text-dsc-text-secondary bg-gray-50 rounded-lg p-2.5">
                                <span className="font-mono text-dsc-green">{formatValue(desiredVal)}</span>
                                <ArrowRight className="h-4 w-4 text-dsc-red" />
                                <span className="font-mono text-dsc-red">{formatValue(actualVal)}</span>
                                <span className="text-xs ml-2">(drifted from desired)</span>
                              </div>
                            )}

                            {/* Plain language explanation */}
                            <div className="rounded-lg bg-dsc-blue-50/50 border border-dsc-blue/10 p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-dsc-blue flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-dsc-text">{explanation.description}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-dsc-red flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-dsc-red">Risk</p>
                                  <p className="text-sm text-dsc-text-secondary">{explanation.risk}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-dsc-yellow flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-dsc-yellow">Recommendation</p>
                                  <p className="text-sm text-dsc-text-secondary">{explanation.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Full state comparison if no individual properties */}
                    {props.length === 0 && (event.desiredState || event.actualState) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-dsc-text-secondary mb-1">Desired State</p>
                          <pre className="code-editor bg-dsc-green-50 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-dsc-green/20">{JSON.stringify(event.desiredState, null, 2)}</pre>
                        </div>
                        <div>
                          <p className="text-xs text-dsc-text-secondary mb-1">Actual State</p>
                          <pre className="code-editor bg-dsc-red-50 rounded-lg p-3 text-xs overflow-auto max-h-48 border border-dsc-red/20">{JSON.stringify(event.actualState, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}
