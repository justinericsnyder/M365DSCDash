"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import { ArrowLeft, Server, FileCode2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface NodeDetail {
  id: string;
  name: string;
  hostname: string;
  platform: string;
  status: string;
  lastSeen: string | null;
  lastDrift: string | null;
  tags: string[];
  configurations: { id: string; status: string; lastApplied: string | null; configuration: { id: string; name: string; status: string } }[];
  driftEvents: { id: string; severity: string; differingProperties: string[]; resolved: boolean; createdAt: string; resourceInstance: { name: string; resourceType: string } | null }[];
}

export default function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/nodes/${id}`)
      .then((r) => r.json())
      .then(setNode)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
      </div>
    );
  }

  if (!node) {
    return <p className="text-center py-12 text-dsc-text-secondary">Node not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/nodes">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back to Nodes</Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-dsc-blue-50 p-3">
            <Server className="h-6 w-6 text-dsc-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-dsc-text">{node.name}</h2>
              <StatusDot status={node.status} pulse />
              <Badge variant={node.status.toLowerCase() as "compliant" | "drifted" | "error"}>{node.status}</Badge>
            </div>
            <p className="text-sm text-dsc-text-secondary mt-1">{node.hostname}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={node.platform.toLowerCase() as "windows" | "linux" | "macos"}>{node.platform}</Badge>
              {node.tags.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        </div>
        <div className="text-right text-sm space-y-1">
          <p className="text-dsc-text-secondary">Last seen: <span className="font-medium text-dsc-text">{timeAgo(node.lastSeen)}</span></p>
          <p className="text-dsc-text-secondary">Last drift: <span className="font-medium text-dsc-text">{timeAgo(node.lastDrift)}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Configurations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode2 className="h-4 w-4 text-dsc-yellow" />
              Assigned Configurations ({node.configurations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {node.configurations.length === 0 ? (
              <p className="text-sm text-dsc-text-secondary py-4 text-center">No configurations assigned.</p>
            ) : (
              <div className="space-y-3">
                {node.configurations.map((nc) => (
                  <div key={nc.id} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div>
                      <p className="font-medium text-sm text-dsc-text">{nc.configuration.name}</p>
                      <p className="text-xs text-dsc-text-secondary">Applied {timeAgo(nc.lastApplied)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={nc.status.toLowerCase() as "compliant" | "drifted"}>{nc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drift History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-dsc-yellow" />
              Drift History ({node.driftEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {node.driftEvents.length === 0 ? (
              <p className="text-sm text-dsc-text-secondary py-4 text-center">No drift events recorded.</p>
            ) : (
              <div className="space-y-3">
                {node.driftEvents.map((de) => (
                  <div key={de.id} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div className="flex items-center gap-3">
                      <StatusDot status={de.severity} />
                      <div>
                        <p className="font-medium text-sm text-dsc-text">
                          {de.resourceInstance?.name || "Unknown Resource"}
                        </p>
                        <p className="text-xs text-dsc-text-secondary">
                          {de.differingProperties.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={de.severity.toLowerCase() as "low" | "medium" | "high" | "critical"}>
                        {de.severity}
                      </Badge>
                      {de.resolved && <Badge variant="compliant">Resolved</Badge>}
                      <span className="text-xs text-dsc-text-secondary">{timeAgo(de.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
