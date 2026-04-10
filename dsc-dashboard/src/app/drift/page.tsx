"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Server,
  Blocks,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function DriftPage() {
  const { driftEvents, driftLoading, fetchDriftEvents, resolveDrift } = useStore();
  const [resolvedFilter, setResolvedFilter] = useState("false");
  const [severityFilter, setSeverityFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (resolvedFilter) filters.resolved = resolvedFilter;
    if (severityFilter) filters.severity = severityFilter;
    fetchDriftEvents(filters);
  }, [fetchDriftEvents, resolvedFilter, severityFilter]);

  const handleResolve = async (id: string) => {
    try {
      await resolveDrift(id);
      fetchDriftEvents({ resolved: resolvedFilter, severity: severityFilter });
      toast.success("Drift event resolved");
    } catch {
      toast.error("Failed to resolve drift event");
    }
  };

  // Summary counts
  const criticalCount = driftEvents.filter((e) => e.severity === "CRITICAL" && !e.resolved).length;
  const highCount = driftEvents.filter((e) => e.severity === "HIGH" && !e.resolved).length;
  const mediumCount = driftEvents.filter((e) => e.severity === "MEDIUM" && !e.resolved).length;
  const lowCount = driftEvents.filter((e) => e.severity === "LOW" && !e.resolved).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Drift Events</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Configuration drift detected across managed nodes
        </p>
      </div>

      {/* Severity Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical", count: criticalCount, color: "bg-dsc-red", textColor: "text-dsc-red", bgColor: "bg-dsc-red-50" },
          { label: "High", count: highCount, color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
          { label: "Medium", count: mediumCount, color: "bg-dsc-yellow", textColor: "text-dsc-yellow", bgColor: "bg-dsc-yellow-50" },
          { label: "Low", count: lowCount, color: "bg-dsc-blue", textColor: "text-dsc-blue", bgColor: "bg-dsc-blue-50" },
        ].map((s) => (
          <Card
            key={s.label}
            hover
            className="cursor-pointer"
            onClick={() => setSeverityFilter(severityFilter === s.label.toUpperCase() ? "" : s.label.toUpperCase())}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${s.bgColor} p-2`}>
                <Shield className={`h-4 w-4 ${s.textColor}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.textColor}`}>{s.count}</p>
                <p className="text-xs text-dsc-text-secondary">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
        >
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Drift Events List */}
      {driftLoading && driftEvents.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
        </div>
      ) : driftEvents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No drift events"
          description={
            resolvedFilter === "false"
              ? "All systems are in their desired state. No unresolved drift detected."
              : "No drift events match the current filters."
          }
        />
      ) : (
        <div className="space-y-3">
          {driftEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            return (
              <Card key={event.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-4">
                    <StatusDot status={event.severity} pulse={!event.resolved} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/nodes/${event.node?.id}`}
                          className="font-semibold text-dsc-text hover:text-dsc-blue"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.node?.name || "Unknown Node"}
                        </Link>
                        <Badge variant={event.severity.toLowerCase() as "low" | "medium" | "high" | "critical"}>
                          {event.severity}
                        </Badge>
                        {event.resolved && <Badge variant="compliant">Resolved</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-dsc-text-secondary">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {event.node?.hostname}
                        </span>
                        {event.resourceInstance && (
                          <span className="flex items-center gap-1">
                            <Blocks className="h-3 w-3" />
                            {event.resourceInstance.name} ({event.resourceInstance.resourceType})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dsc-text-secondary">{timeAgo(event.createdAt)}</span>
                    {!event.resolved && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(event.id);
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-dsc-text-secondary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-dsc-text-secondary" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dsc-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-dsc-text-secondary mb-2">Differing Properties</p>
                        <div className="flex flex-wrap gap-1">
                          {event.differingProperties.map((p) => (
                            <Badge key={p} variant="drifted">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-dsc-text-secondary mb-2">Desired State</p>
                        <pre className="code-editor bg-dsc-green-50 rounded-lg p-3 text-xs overflow-auto max-h-32 border border-dsc-green/20">
                          {JSON.stringify(event.desiredState, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-dsc-text-secondary mb-2">Actual State</p>
                        <pre className="code-editor bg-dsc-red-50 rounded-lg p-3 text-xs overflow-auto max-h-32 border border-dsc-red/20">
                          {JSON.stringify(event.actualState, null, 2)}
                        </pre>
                      </div>
                    </div>
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
