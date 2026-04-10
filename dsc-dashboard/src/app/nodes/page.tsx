"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { Server, Plus, Search, Trash2, Monitor, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NodesPage() {
  const { nodes, nodesLoading, fetchNodes, createNode, deleteNode } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newNode, setNewNode] = useState({ name: "", hostname: "", platform: "WINDOWS", tags: "" });

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter) filters.status = statusFilter;
    if (platformFilter) filters.platform = platformFilter;
    fetchNodes(filters);
  }, [fetchNodes, search, statusFilter, platformFilter]);

  const handleCreate = async () => {
    if (!newNode.name || !newNode.hostname) {
      toast.error("Name and hostname are required");
      return;
    }
    try {
      await createNode({
        name: newNode.name,
        hostname: newNode.hostname,
        platform: newNode.platform,
        tags: newNode.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setShowCreate(false);
      setNewNode({ name: "", hostname: "", platform: "WINDOWS", tags: "" });
      fetchNodes();
      toast.success("Node created");
    } catch {
      toast.error("Failed to create node");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete node "${name}"?`)) return;
    try {
      await deleteNode(id);
      fetchNodes();
      toast.success("Node deleted");
    } catch {
      toast.error("Failed to delete node");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dsc-text">Nodes</h2>
          <p className="text-sm text-dsc-text-secondary mt-1">Managed machines and their compliance status</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" /> Add Node
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input label="Name" placeholder="Web Server 01" value={newNode.name} onChange={(e) => setNewNode({ ...newNode, name: e.target.value })} />
              <Input label="Hostname" placeholder="web-01.contoso.com" value={newNode.hostname} onChange={(e) => setNewNode({ ...newNode, hostname: e.target.value })} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-dsc-text">Platform</label>
                <select
                  className="flex h-9 w-full rounded-lg border border-dsc-border bg-white px-3 py-1 text-sm"
                  value={newNode.platform}
                  onChange={(e) => setNewNode({ ...newNode, platform: e.target.value })}
                >
                  <option value="WINDOWS">Windows</option>
                  <option value="LINUX">Linux</option>
                  <option value="MACOS">macOS</option>
                </select>
              </div>
              <Input label="Tags" placeholder="prod, web, iis" value={newNode.tags} onChange={(e) => setNewNode({ ...newNode, tags: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Create Node</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dsc-text-secondary" />
          <input
            type="text"
            placeholder="Search nodes..."
            className="h-9 w-full rounded-lg border border-dsc-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-dsc-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="DRIFTED">Drifted</option>
          <option value="ERROR">Error</option>
          <option value="UNKNOWN">Unknown</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <select
          className="h-9 rounded-lg border border-dsc-border bg-white px-3 text-sm"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
        >
          <option value="">All Platforms</option>
          <option value="WINDOWS">Windows</option>
          <option value="LINUX">Linux</option>
          <option value="MACOS">macOS</option>
        </select>
      </div>

      {/* Nodes List */}
      {nodesLoading && nodes.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" />
        </div>
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No nodes found"
          description="Add your first node to start managing its desired state configuration."
          actionLabel="Add Node"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid gap-3">
          {nodes.map((node) => (
            <Card key={node.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-dsc-blue-50 p-2.5">
                    <Monitor className="h-5 w-5 text-dsc-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dsc-text">{node.name}</h3>
                      <StatusDot status={node.status} pulse={node.status === "DRIFTED" || node.status === "ERROR"} />
                    </div>
                    <p className="text-sm text-dsc-text-secondary">{node.hostname}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={node.platform.toLowerCase() as "windows" | "linux" | "macos"}>
                        {node.platform}
                      </Badge>
                      <Badge variant={node.status.toLowerCase() as "compliant" | "drifted" | "error" | "unknown" | "offline"}>
                        {node.status}
                      </Badge>
                      {node.tags?.map((tag) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-dsc-text-secondary">Last seen</p>
                    <p className="font-medium text-dsc-text">{timeAgo(node.lastSeen)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-dsc-text-secondary">Configs</p>
                    <p className="font-medium text-dsc-text">{node.configurations?.length || 0}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-dsc-text-secondary">Drift</p>
                    <p className="font-medium text-dsc-text">{node._count?.driftEvents || 0}</p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/nodes/${node.id}`}>
                      <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(node.id, node.name)}>
                      <Trash2 className="h-4 w-4 text-dsc-red" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
