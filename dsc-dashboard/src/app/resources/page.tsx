"use client";

import { useEffect, useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Select,
  Spinner,
  Input,
} from "@fluentui/react-components";
import {
  Apps20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  Filter20Regular,
  Cloud20Regular,
  ShieldCheckmark20Regular,
  Server20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
} from "@fluentui/react-icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

const sourceIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  infra: { icon: Server20Regular, label: "Infrastructure", color: "#7ECC9A" },
  m365: { icon: Cloud20Regular, label: "M365 DSC", color: "#B89ADA" },
  purview: { icon: ShieldCheckmark20Regular, label: "Purview", color: "#7C3AED" },
};

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: "24px" },
  headerSubtext: { color: tokens.colorNeutralForeground3, marginTop: "4px" },
  sourcePills: { display: "flex", flexWrap: "wrap", gap: "8px" },
  sourceBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingLeft: "12px",
    paddingRight: "12px",
    paddingTop: "6px",
    paddingBottom: "6px",
    borderRadius: "9999px",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground3,
    cursor: "pointer",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "150ms",
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  sourceBtnActive: {
    backgroundColor: "#221830",
    color: "#B89ADA",
  },
  clearBtn: {
    background: "none",
    border: "none",
    fontSize: tokens.fontSizeBase200,
    color: "#B89ADA",
    cursor: "pointer",
    ":hover": { textDecoration: "underline" },
  },
  filterRow: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" },
  loadingContainer: { display: "flex", justifyContent: "center", padding: "48px" },
  groupList: { display: "flex", flexDirection: "column", gap: "16px" },
  groupHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  groupCompliance: { marginLeft: "auto", color: tokens.colorNeutralForeground3 },
  itemList: { display: "flex", flexDirection: "column", gap: "6px" },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: "pointer",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  itemLeft: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 },
  itemRight: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  colorSwatch: { width: "12px", height: "12px", borderRadius: "2px", flexShrink: 0 },
  expandedPanel: {
    marginTop: "8px",
    marginLeft: "24px",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  expandedHeader: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  codeTag: {
    fontSize: "10px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    paddingLeft: "8px",
    paddingRight: "8px",
    paddingTop: "2px",
    paddingBottom: "2px",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  propsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "6px",
  },
  propCard: {
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}50`,
  },
  propLabel: {
    fontSize: "9px",
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  arrayContainer: {
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}50`,
  },
  arrayPills: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" },
  arrayPill: {
    fontSize: "10px",
    backgroundColor: "#221830",
    color: "#B89ADA",
    paddingLeft: "6px",
    paddingRight: "6px",
    paddingTop: "2px",
    paddingBottom: "2px",
    borderRadius: "9999px",
  },
  objectContainer: {
    padding: "8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}50`,
  },
  objectGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "4px" },
  objectEntry: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    paddingLeft: "6px",
    paddingRight: "6px",
    paddingTop: "2px",
    paddingBottom: "2px",
    fontSize: "10px",
  },
});

export default function ResourcesPage() {
  const styles = useStyles();
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

  // Group by source + resourceType
  const grouped = resources.reduce((acc, r) => {
    const key = `${r.source}/${r.resourceType}`;
    if (!acc[key]) acc[key] = { source: r.source, resourceType: r.resourceType, items: [] };
    acc[key].items.push(r);
    return acc;
  }, {} as Record<string, { source: string; resourceType: string; items: any[] }>);

  const sourceCounts = resources.reduce((acc, r) => { acc[r.source] = (acc[r.source] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className={styles.page}>
      <div>
        <Text size={700} weight="bold" block>Resources</Text>
        <Text size={300} block className={styles.headerSubtext}>
          Unified view across Infrastructure DSC, M365 DSC, and Purview ({resources.length} total)
        </Text>
      </div>

      {/* Source summary pills */}
      <div className={styles.sourcePills}>
        {Object.entries(sourceCounts).map(([src, count]) => {
          const meta = sourceIcons[src] || sourceIcons.infra;
          const Icon = meta.icon;
          const isActive = sourceFilter === src;
          return (
            <button
              key={src}
              onClick={() => setSourceFilter(isActive ? "" : src)}
              className={styles.sourceBtn}
              style={isActive ? { backgroundColor: "#221830", borderColor: "#B89ADA50", color: "#B89ADA" } : undefined}
            >
              <Icon style={{ color: meta.color, fontSize: 12 }} />
              {meta.label}
              <Text weight="bold" size={200}>{String(count)}</Text>
            </button>
          );
        })}
        {sourceFilter && (
          <button onClick={() => setSourceFilter("")} className={styles.clearBtn}>Clear</button>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <Filter20Regular style={{ color: tokens.colorNeutralForeground3 }} />
        <Input
          type="text"
          placeholder="Filter by resource type..."
          appearance="filled-darker"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 220 }}
        />
        <Select
          value={complianceFilter}
          onChange={(e) => setComplianceFilter((e.target as HTMLSelectElement).value)}
          appearance="filled-darker"
          style={{ height: 32 }}
        >
          <option value="">All States</option>
          <option value="true">Compliant</option>
          <option value="false">Drifted</option>
        </Select>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading resources..." />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState icon={Apps20Regular} title="No resources found" description="Resources appear when you sync data or add DSC configurations." />
      ) : (
        <div className={styles.groupList}>
          {Object.values(grouped).map((group: any) => {
            const meta = sourceIcons[group.source] || sourceIcons.infra;
            const Icon = meta.icon;
            const compliant = group.items.filter((r: any) => r.status === "COMPLIANT").length;
            return (
              <Card key={`${group.source}/${group.resourceType}`}>
                <div className={styles.groupHeader}>
                  <Icon style={{ color: meta.color }} />
                  <Text weight="semibold" size={300}>{group.resourceType}</Text>
                  <Badge variant={group.source === "m365" ? "active" : group.source === "purview" ? "medium" : "default"}>{meta.label}</Badge>
                  <Text size={200} className={styles.groupCompliance}>{compliant}/{group.items.length} compliant</Text>
                </div>
                <div className={styles.itemList}>
                  {group.items.map((res: any) => (
                    <UnifiedResourceItem key={res.id} res={res} />
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

/* ─── Expandable Resource Item ───────────────────────── */
function UnifiedResourceItem({ res }: { res: any }) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const props = res.properties || {};
  const entries = Object.entries(props).filter(([, v]) => v !== null && v !== undefined);
  const simpleProps = entries.filter(([, v]) => typeof v !== "object");
  const complexProps = entries.filter(([, v]) => typeof v === "object" && v !== null);

  const boolColor = (val: unknown) => val === true ? "#7ECC9A" : val === false ? "#F28B8B" : tokens.colorNeutralForeground1;

  return (
    <div>
      <div className={styles.itemRow} onClick={() => setExpanded(!expanded)}>
        <div className={styles.itemLeft}>
          {res.status === "COMPLIANT"
            ? <CheckmarkCircle20Regular style={{ color: "#7ECC9A", flexShrink: 0, fontSize: 14 }} />
            : <DismissCircle20Regular style={{ color: "#F28B8B", flexShrink: 0, fontSize: 14 }} />
          }
          {res.color && <div className={styles.colorSwatch} style={{ backgroundColor: res.color }} />}
          <div>
            <Text size={300} weight="medium">{res.name}</Text>
            {res.parentName && (
              <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                {res.parentName}{res.workload ? ` · ${res.workload}` : ""}
              </Text>
            )}
          </div>
        </div>
        <div className={styles.itemRight}>
          {res.driftCount > 0 && <Badge variant="drifted">{res.driftCount} drift</Badge>}
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{timeAgo(res.lastChecked)}</Text>
          {expanded ? <ChevronUp20Regular style={{ color: tokens.colorNeutralForeground3, fontSize: 14 }} /> : <ChevronDown20Regular style={{ color: tokens.colorNeutralForeground3, fontSize: 14 }} />}
        </div>
      </div>

      {expanded && (
        <div className={styles.expandedPanel}>
          {/* Header */}
          <div className={styles.expandedHeader}>
            <span className={styles.codeTag}>{res.resourceType}</span>
            <Badge variant={res.status === "COMPLIANT" ? "compliant" : "drifted"}>{res.status}</Badge>
            {res.source && <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{res.source}</Text>}
          </div>

          {/* Simple properties grid */}
          {simpleProps.length > 0 && (
            <div className={styles.propsGrid}>
              {simpleProps.map(([key, val]) => (
                <div key={key} className={styles.propCard}>
                  <Text block className={styles.propLabel}>{key.replace(/([A-Z])/g, " $1").trim()}</Text>
                  <Text size={200} weight="medium" style={{ marginTop: "2px", color: typeof val === "boolean" ? boolColor(val) : tokens.colorNeutralForeground1 }}>
                    {typeof val === "boolean" ? (val ? "✓ Yes" : "✗ No") : String(val)}
                  </Text>
                </div>
              ))}
            </div>
          )}

          {/* Complex properties */}
          {complexProps.map(([key, val]) => {
            if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
              return (
                <div key={key} className={styles.arrayContainer}>
                  <Text block className={styles.propLabel}>{key.replace(/([A-Z])/g, " $1").trim()}</Text>
                  <div className={styles.arrayPills}>
                    {(val as string[]).map((item, i) => (
                      <span key={i} className={styles.arrayPill}>{item}</span>
                    ))}
                  </div>
                </div>
              );
            }
            if (typeof val === "object" && val !== null && !Array.isArray(val)) {
              const subEntries = Object.entries(val as Record<string, unknown>).filter(([, v]) => v != null);
              return (
                <div key={key} className={styles.objectContainer}>
                  <Text block className={styles.propLabel}>{key.replace(/([A-Z])/g, " $1").trim()}</Text>
                  <div className={styles.objectGrid}>
                    {subEntries.slice(0, 8).map(([sk, sv]) => (
                      <div key={sk} className={styles.objectEntry}>
                        <span style={{ color: tokens.colorNeutralForeground3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 4 }}>
                          {sk.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span style={{ fontWeight: tokens.fontWeightMedium as any, color: typeof sv === "boolean" ? boolColor(sv) : tokens.colorNeutralForeground1 }}>
                          {typeof sv === "boolean" ? (sv ? "✓" : "✗") : String(sv).substring(0, 30)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
