"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import {
  ArrowLeft,
  FileCode2,
  Blocks,
  Server,
  CheckCircle2,
  XCircle,
  Code2,
} from "lucide-react";
import Link from "next/link";

interface ConfigDetail {
  id: string;
  name: string;
  description: string | null;
  document: Record<string, unknown>;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  resources: {
    id: string;
    name: string;
    resourceType: string;
    properties: Record<string, unknown>;
    desiredState: Record<string, unknown> | null;
    actualState: Record<string, unknown> | null;
    inDesiredState: boolean;
    lastChecked: string | null;
    driftEvents: { id: string; severity: string; createdAt: string }[];
  }[];
  nodes: {
    id: string;
    status: string;
    lastApplied: string | null;
    node: { id: string; name: string; hostname: string; platform: string; status: string };
  }[];
}

export default function ConfigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<ConfigDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDocument, setShowDocument] = useState(false);

  useEffect(() => {
    fetch(`/api/configurations/${id}`)
      .then((r) => r.json())
      .then(setConfig)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
      </div>
    );
  }

  if (!config) {
    return <p className="text-center py-12 text-dsc-text-secondary">Configuration not found.</p>;
  }

  const compliantCount = config.resources.filter((r) => r.inDesiredState).length;
  const totalCount = config.resources.length;

  return (
    <div className="space-y-6">
      <Link href="/configurations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to Configurations
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-dsc-yellow-50 p-3">
            <FileCode2 className="h-6 w-6 text-dsc-yellow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-dsc-text">{config.name}</h2>
              <Badge variant={config.status.toLowerCase() as "active" | "draft" | "archived"}>
                {config.status}
              </Badge>
              <span className="text-sm text-dsc-text-secondary">v{config.version}</span>
            </div>
            {config.description && (
              <p className="text-sm text-dsc-text-secondary mt-1">{config.description}</p>
            )}
            <p className="text-xs text-dsc-text-secondary mt-2">
              Created {timeAgo(config.createdAt)} · Updated {timeAgo(config.updatedAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowDocument(!showDocument)}>
          <Code2 className="h-4 w-4" />
          {showDocument ? "Hide" : "View"} Document
        </Button>
      </div>

      {/* Raw Document */}
      {showDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Document (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="code-editor bg-gray-50 rounded-lg p-4 overflow-auto max-h-96 border border-dsc-border text-xs">
              {JSON.stringify(config.document, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-red-50 p-2">
              <Blocks className="h-5 w-5 text-dsc-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-text">{totalCount}</p>
              <p className="text-xs text-dsc-text-secondary">Resource Instances</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-green-50 p-2">
              <CheckCircle2 className="h-5 w-5 text-dsc-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-text">
                {totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0}%
              </p>
              <p className="text-xs text-dsc-text-secondary">Compliant ({compliantCount}/{totalCount})</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-dsc-blue-50 p-2">
              <Server className="h-5 w-5 text-dsc-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dsc-text">{config.nodes.length}</p>
              <p className="text-xs text-dsc-text-secondary">Assigned Nodes</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Instances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Blocks className="h-4 w-4 text-dsc-red" />
              Resource Instances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border"
                >
                  <div className="flex items-center gap-3">
                    {res.inDesiredState ? (
                      <CheckCircle2 className="h-4 w-4 text-dsc-green flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-dsc-red flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-dsc-text">{res.name}</p>
                      <p className="text-xs text-dsc-text-secondary">{res.resourceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {res.driftEvents.length > 0 && (
                      <Badge variant="drifted">{res.driftEvents.length} drift</Badge>
                    )}
                    <span className="text-xs text-dsc-text-secondary">
                      {timeAgo(res.lastChecked)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Nodes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-dsc-blue" />
              Assigned Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config.nodes.length === 0 ? (
              <p className="text-sm text-dsc-text-secondary py-4 text-center">
                No nodes assigned to this configuration.
              </p>
            ) : (
              <div className="space-y-2">
                {config.nodes.map((nc) => (
                  <Link key={nc.id} href={`/nodes/${nc.node.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border hover:border-dsc-blue/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <StatusDot status={nc.node.status} />
                        <div>
                          <p className="font-medium text-sm text-dsc-text">{nc.node.name}</p>
                          <p className="text-xs text-dsc-text-secondary">{nc.node.hostname}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            nc.node.platform.toLowerCase() as "windows" | "linux" | "macos"
                          }
                        >
                          {nc.node.platform}
                        </Badge>
                        <Badge
                          variant={
                            nc.status === "APPLIED"
                              ? "compliant"
                              : nc.status === "DRIFTED"
                                ? "drifted"
                                : nc.status === "FAILED"
                                  ? "error"
                                  : "unknown"
                          }
                        >
                          {nc.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
