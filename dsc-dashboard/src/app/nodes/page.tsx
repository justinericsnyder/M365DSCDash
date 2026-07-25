"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Field,
  Select,
  Spinner,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Server20Regular,
  Add20Regular,
  Search20Regular,
  Delete20Regular,
  Desktop20Regular,
  Open20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  nodeGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  nodeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nodeLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  nodeIconBox: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#221830",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nodeInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nameLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badges: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },
  nodeRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statCell: {
    textAlign: "right",
  },
  actions: {
    display: "flex",
    gap: "4px",
  },
  formActions: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },
});

export default function NodesPage() {
  const styles = useStyles();
  const { nodes, nodesLoading, fetchNodes, createNode, deleteNode } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newNode, setNewNode] = useState({ name: "", hostname: "", platform: "WINDOWS", tags: "" });
  const toasterId = useId("nodes-toaster");
  const { dispatchToast } = useToastController(toasterId);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter) filters.status = statusFilter;
    if (platformFilter) filters.platform = platformFilter;
    fetchNodes(filters);
  }, [fetchNodes, search, statusFilter, platformFilter]);

  const handleCreate = async () => {
    if (!newNode.name || !newNode.hostname) {
      dispatchToast(<Toast><ToastTitle>Name and hostname are required</ToastTitle></Toast>, { intent: "error" });
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
      dispatchToast(<Toast><ToastTitle>Node created</ToastTitle></Toast>, { intent: "success" });
    } catch {
      dispatchToast(<Toast><ToastTitle>Failed to create node</ToastTitle></Toast>, { intent: "error" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete node "${name}"?`)) return;
    try {
      await deleteNode(id);
      fetchNodes();
      dispatchToast(<Toast><ToastTitle>Node deleted</ToastTitle></Toast>, { intent: "success" });
    } catch {
      dispatchToast(<Toast><ToastTitle>Failed to delete node</ToastTitle></Toast>, { intent: "error" });
    }
  };

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />

      <div className={styles.headerRow}>
        <div>
          <Text size={700} weight="bold" block>Nodes</Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>Managed machines and their compliance status</Text>
        </div>
        <Button appearance="primary" icon={<Add20Regular />} onClick={() => setShowCreate(!showCreate)}>
          Add Node
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardContent>
            <div className={styles.createGrid}>
              <Field label="Name">
                <Input placeholder="Web Server 01" value={newNode.name} onChange={(e) => setNewNode({ ...newNode, name: (e.target as HTMLInputElement).value })} appearance="filled-darker" />
              </Field>
              <Field label="Hostname">
                <Input placeholder="web-01.contoso.com" value={newNode.hostname} onChange={(e) => setNewNode({ ...newNode, hostname: (e.target as HTMLInputElement).value })} appearance="filled-darker" />
              </Field>
              <Field label="Platform">
                <Select value={newNode.platform} onChange={(e) => setNewNode({ ...newNode, platform: (e.target as HTMLSelectElement).value })} appearance="filled-darker">
                  <option value="WINDOWS">Windows</option>
                  <option value="LINUX">Linux</option>
                  <option value="MACOS">macOS</option>
                </Select>
              </Field>
              <Field label="Tags">
                <Input placeholder="prod, web, iis" value={newNode.tags} onChange={(e) => setNewNode({ ...newNode, tags: (e.target as HTMLInputElement).value })} appearance="filled-darker" />
              </Field>
            </div>
            <div className={styles.formActions}>
              <Button appearance="primary" onClick={handleCreate}>Create Node</Button>
              <Button appearance="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className={styles.filterRow}>
        <Input
          contentBefore={<Search20Regular />}
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          appearance="filled-darker"
          style={{ width: 256 }}
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)} appearance="filled-darker">
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="DRIFTED">Drifted</option>
          <option value="ERROR">Error</option>
          <option value="UNKNOWN">Unknown</option>
          <option value="OFFLINE">Offline</option>
        </Select>
        <Select value={platformFilter} onChange={(e) => setPlatformFilter((e.target as HTMLSelectElement).value)} appearance="filled-darker">
          <option value="">All Platforms</option>
          <option value="WINDOWS">Windows</option>
          <option value="LINUX">Linux</option>
          <option value="MACOS">macOS</option>
        </Select>
      </div>

      {/* Nodes List */}
      {nodesLoading && nodes.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner size="large" label="Loading nodes..." />
        </div>
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={Server20Regular}
          title="No nodes found"
          description="Add your first node to start managing its desired state configuration."
          actionLabel="Add Node"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className={styles.nodeGrid}>
          {nodes.map((node) => (
            <Card key={node.id} hover>
              <div className={styles.nodeRow}>
                <div className={styles.nodeLeft}>
                  <div className={styles.nodeIconBox}>
                    <Desktop20Regular style={{ color: "#B89ADA" }} />
                  </div>
                  <div className={styles.nodeInfo}>
                    <div className={styles.nameLine}>
                      <Text weight="semibold">{node.name}</Text>
                      <StatusDot status={node.status} pulse={node.status === "DRIFTED" || node.status === "ERROR"} />
                    </div>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{node.hostname}</Text>
                    <div className={styles.badges}>
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
                <div className={styles.nodeRight}>
                  <div className={styles.statCell}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Last seen</Text>
                    <Text size={300} weight="medium" block>{timeAgo(node.lastSeen)}</Text>
                  </div>
                  <div className={styles.statCell}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Configs</Text>
                    <Text size={300} weight="medium" block>{node.configurations?.length || 0}</Text>
                  </div>
                  <div className={styles.statCell}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Drift</Text>
                    <Text size={300} weight="medium" block>{node._count?.driftEvents || 0}</Text>
                  </div>
                  <div className={styles.actions}>
                    <Link href={`/nodes/${node.id}`}>
                      <Button appearance="subtle" icon={<Open20Regular />} size="small" />
                    </Link>
                    <Button appearance="subtle" icon={<Delete20Regular style={{ color: "#F28B8B" }} />} size="small" onClick={() => handleDelete(node.id, node.name)} />
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
