"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import {
  FileCode2,
  Plus,
  Blocks,
  Server,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ConfigurationsPage() {
  const { configurations, configsLoading, fetchConfigurations, createConfiguration } = useStore();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", document: "" });

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (statusFilter) filters.status = statusFilter;
    fetchConfigurations(filters);
  }, [fetchConfigurations, statusFilter]);

  const handleCreate = async () => {
    if (!form.name || !form.document) {
      toast.error("Name and document are required");
      return;
    }
    try {
      await createConfiguration({
        name: form.name,
        description: form.description || undefined,
        document: form.document,
      });
      setShowCreate(false);
      setForm({ name: "", description: "", document: "" });
      fetchConfigurations();
      toast.success("Configuration created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create configuration");
    }
  };

  const sampleDoc = `$schema: https://aka.ms/dsc/schemas/v3/bundled/config/document.json
resources:
  - name: Example Registry Key
    type: Microsoft.Windows/Registry
    properties:
      keyPath: HKCU\\\\example\\\\key
      valueName: Example
      valueData:
        String: Hello from DSC`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dsc-text">Configurations</h2>
          <p className="text-sm text-dsc-text-secondary mt-1">
            DSC configuration documents defining desired state
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" /> New Configuration
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Configuration Name"
                  placeholder="Web Server Baseline"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Description"
                  placeholder="Standard web server configuration..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Textarea
                label="DSC Configuration Document (YAML or JSON)"
                placeholder={sampleDoc}
                className="code-editor min-h-[200px]"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate}>Create Configuration</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="ghost" onClick={() => setForm({ ...form, document: sampleDoc })}>
                  Load Sample
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="h-9 rounded-lg border border-dsc-border bg-dsc-surface px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Configurations List */}
      {configsLoading && configurations.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
        </div>
      ) : configurations.length === 0 ? (
        <EmptyState
          icon={FileCode2}
          title="No configurations found"
          description="Create your first DSC configuration document to define desired state."
          actionLabel="New Configuration"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid gap-4">
          {configurations.map((config) => {
            const totalRes = config._count?.resources || 0;
            const compliantRes = config.resources?.filter((r) => r.inDesiredState).length || 0;
            const resPct = totalRes > 0 ? Math.round((compliantRes / totalRes) * 100) : 0;
            const resourceTypes = [...new Set(config.resources?.map((r) => r.resourceType) || [])];

            return (
              <Link key={config.id} href={`/configurations/${config.id}`}>
                <Card hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-dsc-yellow-50 p-2">
                          <FileCode2 className="h-4 w-4 text-dsc-yellow" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-dsc-text">{config.name}</h3>
                            <Badge
                              variant={config.status.toLowerCase() as "active" | "draft" | "archived"}
                            >
                              {config.status}
                            </Badge>
                            <span className="text-xs text-dsc-text-secondary">v{config.version}</span>
                          </div>
                          {config.description && (
                            <p className="text-sm text-dsc-text-secondary mt-0.5">{config.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Resource types */}
                      <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
                        {resourceTypes.map((rt) => (
                          <span
                            key={rt}
                            className="inline-flex items-center gap-1 rounded-md bg-dsc-bg px-2 py-0.5 text-xs text-dsc-text-secondary border border-dsc-border/50"
                          >
                            <Blocks className="h-3 w-3" />
                            {rt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Resource compliance mini-bar */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green" />
                          <span className="font-medium">{compliantRes}</span>
                          <span className="text-dsc-text-secondary">/</span>
                          <span>{totalRes}</span>
                          {totalRes > 0 && totalRes !== compliantRes && (
                            <XCircle className="h-3.5 w-3.5 text-dsc-red ml-1" />
                          )}
                        </div>
                        <p className="text-xs text-dsc-text-secondary">resources</p>
                        <div className="h-1.5 w-20 rounded-full bg-dsc-border/30 mt-1">
                          <div
                            className="h-1.5 rounded-full bg-dsc-green transition-all"
                            style={{ width: `${resPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Node count */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <Server className="h-3.5 w-3.5 text-dsc-blue" />
                          <span className="font-medium">{config._count?.nodes || 0}</span>
                        </div>
                        <p className="text-xs text-dsc-text-secondary">nodes</p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-dsc-text-secondary" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

