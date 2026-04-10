"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Blocks, CheckCircle2, XCircle, Filter, Cloud, ShieldCheck, Server } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (complianceFilter) params.set("compliant", complianceFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    fetch(`/api/resources?${params}`).then((r) => r.json()).then(setResources).finally(() => setLoading(false));
  }, [typeFilter, complianceFilter, sourceFilter]);

  const sourceIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    infra: { icon: Server, label: "Infrastructure", color: "text-dsc-green" },
    m365: { icon: Cloud, label: "M365 DSC", color: "text-dsc-blue" },
    purview: { icon: ShieldCheck, label: "Purview", color: "text-purple-600" },
  };

  // Group by source + resourceType
  const grouped = resources.reduce((acc, r) => {
    const key = `${r.source}/${r.resourceType}`;
    if (!acc[key]) acc[key] = { source: r.source, resourceType: r.resourceType, items: [] };
    acc[key].items.push(r);
    return acc;
  }, {} as Record<string, { source: string; resourceType: string; items: any[] }>);

  const sourceCounts = resources.reduce((acc, r) => { acc[r.source] = (acc[r.source] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Resources</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Unified view across Infrastructure DSC, M365 DSC, and Purview ({resources.length} total)
        </p>
      </div>

      {/* Source summary pills */}
      <div className="flex flex-wrap gap-2">
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
        {sourceFilter && <button onClick={() => setSourceFilter("")} className="text-xs text-dsc-blue hover:underline">Clear</button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-dsc-text-secondary" />
        <input type="text" placeholder="Filter by resource type..." className="h-9 w-48 sm:w-64 rounded-lg border border-dsc-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-dsc-blue" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
        <select className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm" value={complianceFilter} onChange={(e) => setComplianceFilter(e.target.value)}>
          <option value="">All States</option>
          <option value="true">Compliant</option>
          <option value="false">Drifted</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>
      ) : resources.length === 0 ? (
        <EmptyState icon={Blocks} title="No resources found" description="Resources appear when you sync data or add DSC configurations." />
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map((group: any) => {
            const meta = sourceIcons[group.source] || sourceIcons.infra;
            const Icon = meta.icon;
            const compliant = group.items.filter((r: any) => r.status === "COMPLIANT").length;
            return (
              <Card key={`${group.source}/${group.resourceType}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className="font-semibold text-sm text-dsc-text">{group.resourceType}</h3>
                  <Badge variant={group.source === "m365" ? "active" : group.source === "purview" ? "medium" : "default"}>{meta.label}</Badge>
                  <span className="text-xs text-dsc-text-secondary ml-auto">{compliant}/{group.items.length} compliant</span>
                </div>
                <div className="space-y-1.5">
                  {group.items.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dsc-bg border border-dsc-border">
                      <div className="flex items-center gap-2.5">
                        {res.status === "COMPLIANT" ? <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-dsc-red flex-shrink-0" />}
                        {res.color && <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: res.color }} />}
                        <div>
                          <p className="text-sm font-medium text-dsc-text">{res.name}</p>
                          {res.parentName && <p className="text-xs text-dsc-text-secondary">{res.parentName}{res.workload ? ` · ${res.workload}` : ""}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.driftCount > 0 && <Badge variant="drifted">{res.driftCount} drift</Badge>}
                        <span className="text-xs text-dsc-text-secondary">{timeAgo(res.lastChecked)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
