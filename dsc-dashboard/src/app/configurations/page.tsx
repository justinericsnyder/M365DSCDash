"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Select,
  Spinner,
  Field,
  Textarea,
  Input,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Document20Regular,
  Add20Regular,
  Apps20Regular,
  Server20Regular,
  ChevronRight20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: "24px" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  createForm: { display: "flex", flexDirection: "column", gap: "16px" },
  createGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  formActions: { display: "flex", gap: "8px" },
  configGrid: { display: "flex", flexDirection: "column", gap: "16px" },
  configRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  configLeft: { flex: 1 },
  configMeta: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" },
  iconBox: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#2E2010",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nameLine: { display: "flex", alignItems: "center", gap: "8px" },
  resourceTypes: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px", marginLeft: "44px" },
  resourceTypePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "2px 8px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  configRight: { display: "flex", alignItems: "center", gap: "24px" },
  statCol: { textAlign: "center" },
  miniBar: {
    height: "6px",
    width: "80px",
    borderRadius: "3px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    marginTop: "4px",
    overflow: "hidden",
  },
  miniFill: { height: "6px", borderRadius: "3px", backgroundColor: "#7ECC9A" },
  link: { textDecoration: "none", color: "inherit" },
});

export default function ConfigurationsPage() {
  const styles = useStyles();
  const { configurations, configsLoading, fetchConfigurations, createConfiguration } = useStore();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", document: "" });
  const toasterId = useId("config-toaster");
  const { dispatchToast } = useToastController(toasterId);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (statusFilter) filters.status = statusFilter;
    fetchConfigurations(filters);
  }, [fetchConfigurations, statusFilter]);

  const handleCreate = async () => {
    if (!form.name || !form.document) {
      dispatchToast(<Toast><ToastTitle>Name and document are required</ToastTitle></Toast>, { intent: "error" });
      return;
    }
    try {
      await createConfiguration({ name: form.name, description: form.description || undefined, document: form.document });
      setShowCreate(false);
      setForm({ name: "", description: "", document: "" });
      fetchConfigurations();
      dispatchToast(<Toast><ToastTitle>Configuration created</ToastTitle></Toast>, { intent: "success" });
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{e instanceof Error ? e.message : "Failed to create configuration"}</ToastTitle></Toast>, { intent: "error" });
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
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />

      <div className={styles.headerRow}>
        <div>
          <Text size={700} weight="bold" block>Configurations</Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>DSC configuration documents defining desired state</Text>
        </div>
        <Button appearance="primary" icon={<Add20Regular />} onClick={() => setShowCreate(!showCreate)}>
          New Configuration
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent>
            <div className={styles.createForm}>
              <div className={styles.createGrid}>
                <Field label="Configuration Name">
                  <Input placeholder="Web Server Baseline" value={form.name} onChange={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })} appearance="filled-darker" />
                </Field>
                <Field label="Description">
                  <Input placeholder="Standard web server configuration..." value={form.description} onChange={(e) => setForm({ ...form, description: (e.target as HTMLInputElement).value })} appearance="filled-darker" />
                </Field>
              </div>
              <Field label="DSC Configuration Document (YAML or JSON)">
                <Textarea
                  placeholder={sampleDoc}
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: (e.target as HTMLTextAreaElement).value })}
                  appearance="filled-darker"
                  resize="vertical"
                  style={{ minHeight: 200, fontFamily: "monospace" }}
                />
              </Field>
              <div className={styles.formActions}>
                <Button appearance="primary" onClick={handleCreate}>Create Configuration</Button>
                <Button appearance="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button appearance="subtle" onClick={() => setForm({ ...form, document: sampleDoc })}>Load Sample</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)} appearance="filled-darker">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {configsLoading && configurations.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner size="large" label="Loading configurations..." />
        </div>
      ) : configurations.length === 0 ? (
        <EmptyState
          icon={Document20Regular}
          title="No configurations found"
          description="Create your first DSC configuration document to define desired state."
          actionLabel="New Configuration"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className={styles.configGrid}>
          {configurations.map((config) => {
            const totalRes = config._count?.resources || 0;
            const compliantRes = config.resources?.filter((r) => r.inDesiredState).length || 0;
            const resPct = totalRes > 0 ? Math.round((compliantRes / totalRes) * 100) : 0;
            const resourceTypes = [...new Set(config.resources?.map((r) => r.resourceType) || [])];

            return (
              <Link key={config.id} href={`/configurations/${config.id}`} className={styles.link}>
                <Card hover>
                  <div className={styles.configRow}>
                    <div className={styles.configLeft}>
                      <div className={styles.configMeta}>
                        <div className={styles.iconBox}>
                          <Document20Regular style={{ color: "#E8D07A" }} />
                        </div>
                        <div>
                          <div className={styles.nameLine}>
                            <Text weight="semibold">{config.name}</Text>
                            <Badge variant={config.status.toLowerCase() as "active" | "draft" | "archived"}>{config.status}</Badge>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>v{config.version}</Text>
                          </div>
                          {config.description && (
                            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>{config.description}</Text>
                          )}
                        </div>
                      </div>
                      <div className={styles.resourceTypes}>
                        {resourceTypes.map((rt) => (
                          <span key={rt} className={styles.resourceTypePill}>
                            <Apps20Regular style={{ fontSize: 12 }} />{rt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.configRight}>
                      <div className={styles.statCol}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckmarkCircle20Regular style={{ fontSize: 14, color: "#7ECC9A" }} />
                          <Text size={300} weight="medium">{compliantRes}</Text>
                          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>/</Text>
                          <Text size={300}>{totalRes}</Text>
                          {totalRes > 0 && totalRes !== compliantRes && <DismissCircle20Regular style={{ fontSize: 14, color: "#F28B8B" }} />}
                        </div>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>resources</Text>
                        <div className={styles.miniBar}><div className={styles.miniFill} style={{ width: `${resPct}%` }} /></div>
                      </div>
                      <div className={styles.statCol}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Server20Regular style={{ fontSize: 14, color: "#B89ADA" }} />
                          <Text size={300} weight="medium">{config._count?.nodes || 0}</Text>
                        </div>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>nodes</Text>
                      </div>
                      <ChevronRight20Regular style={{ color: tokens.colorNeutralForeground3 }} />
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
