"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Blocks,
  CheckCircle2,
  XCircle,
  FileCode2,
  Filter,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export default function ResourcesPage() {
  const { resources, resourcesLoading, fetchResources } = useStore();
  const [typeFilter, setTypeFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (typeFilter) filters.type = typeFilter;
    if (complianceFilter) filters.compliant = complianceFilter;
    fetchResources(filters);
  }, [fetchResources, typeFilter, complianceFilter]);

  // Group resources by type for the summary
  const typeGroups = resources.reduce(
    (acc, r) => {
      const t = r.resourceType;
      if (!acc[t]) acc[t] = { total: 0, compliant: 0 };
      acc[t].total++;
      if (r.inDesiredState) acc[t].compliant++;
      return acc;
    },
    {} as Record<string, { total: number; compliant: number }>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Resources</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          All DSC resource instances across configurations
        </p>
      </div>

      {/* Type Summary Cards */}
      {Object.keys(typeGroups).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(typeGroups).map(([type, counts]) => {
            const pct = Math.round((counts.compliant / counts.total) * 100);
            return (
              <Card
                key={type}
                hover
                className="cursor-pointer"
                onClick={() => setTypeFilter(typeFilter === type ? "" : type.split("/").pop() || "")}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-dsc-text-secondary truncate max-w-[140px]">
                      {type.split("/")[0]}
                    </p>
                    <p className="text-sm font-semibold text-dsc-text mt-0.5">
                      {type.split("/").pop()}
                    </p>
                  </div>
                  <span
                    className={`text-lg font-bold ${pct === 100 ? "text-dsc-green" : pct >= 70 ? "text-dsc-yellow" : "text-dsc-red"}`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 mt-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-dsc-green" : pct >= 70 ? "bg-dsc-yellow" : "bg-dsc-red"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-dsc-text-secondary mt-1">
                  {counts.compliant}/{counts.total} compliant
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-dsc-text-secondary" />
        <input
          type="text"
          placeholder="Filter by resource type..."
          className="h-9 w-64 rounded-lg border border-dsc-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-dsc-blue"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={complianceFilter}
          onChange={(e) => setComplianceFilter(e.target.value)}
        >
          <option value="">All States</option>
          <option value="true">Compliant</option>
          <option value="false">Drifted</option>
        </select>
        {(typeFilter || complianceFilter) && (
          <button
            className="text-xs text-dsc-blue hover:underline"
            onClick={() => {
              setTypeFilter("");
              setComplianceFilter("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Resources Table */}
      {resourcesLoading && resources.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Blocks}
          title="No resources found"
          description="Resources are created when you add DSC configuration documents."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dsc-border bg-dsc-bg">
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Resource Type</th>
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Configuration</th>
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Drift Events</th>
                    <th className="text-left py-3 px-4 font-medium text-dsc-text-secondary">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dsc-border">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        {res.inDesiredState ? (
                          <CheckCircle2 className="h-4 w-4 text-dsc-green" />
                        ) : (
                          <XCircle className="h-4 w-4 text-dsc-red" />
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-dsc-text">{res.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs border border-gray-100">
                          <Blocks className="h-3 w-3" />
                          {res.resourceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/configurations/${res.configuration.id}`}
                          className="inline-flex items-center gap-1 text-dsc-blue hover:underline"
                        >
                          <FileCode2 className="h-3 w-3" />
                          {res.configuration.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {(res._count?.driftEvents || 0) > 0 ? (
                          <Badge variant="drifted">{res._count?.driftEvents}</Badge>
                        ) : (
                          <span className="text-dsc-text-secondary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-dsc-text-secondary">
                        {timeAgo(res.lastChecked)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
