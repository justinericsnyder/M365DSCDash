"use client";

import { useEffect, useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Select,
  Spinner,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Warning20Regular,
  CheckmarkCircle20Regular,
  Server20Regular,
  Cloud20Regular,
  ShieldCheckmark20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  Shield20Regular,
  Info20Regular,
  ArrowRight20Regular,
  Lightbulb20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import { getExplanation, getGenericExplanation } from "@/lib/drift-explanations";

/* eslint-disable @typescript-eslint/no-explicit-any */

const sourceIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  infra: { icon: Server20Regular, label: "Infrastructure", color: "#7ECC9A" },
  m365: { icon: Cloud20Regular, label: "M365 DSC", color: "#B89ADA" },
  purview: { icon: ShieldCheckmark20Regular, label: "Purview", color: "#7C3AED" },
};

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: "24px" },
  severityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" },
  filterRow: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" },
  sourceBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground3,
    cursor: "pointer",
    transitionProperty: "background-color, border-color",
    transitionDuration: "150ms",
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  sourceBtnActive: {
    backgroundColor: "#221830",
    color: "#B89ADA",
  },
  eventList: { display: "flex", flexDirection: "column", gap: "12px" },
  eventHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  eventLeft: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 },
  eventRight: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  propPills: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" },
  propPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: tokens.fontSizeBase200,
    backgroundColor: "#3A0E14",
    color: "#F28B8B",
    padding: "4px 8px",
    borderRadius: tokens.borderRadiusMedium,
    border: "1px solid #F28B8B30",
  },
  expandedSection: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  propBlock: {
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: "hidden",
  },
  propHeader: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  propBody: { padding: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  stateGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  desiredBox: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#18241C",
    border: "1px solid #7ECC9A30",
    padding: "12px",
  },
  actualBox: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#3A0E14",
    border: "1px solid #F28B8B30",
    padding: "12px",
  },
  driftArrow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: "10px",
  },
  explanationBox: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "#22183050",
    border: "1px solid #B89ADA15",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  explRow: { display: "flex", alignItems: "flex-start", gap: "8px" },
  unresolvedBorder: { borderLeft: "4px solid #F28B8B60" },
});

export default function DriftPage() {
  const styles = useStyles();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedFilter, setResolvedFilter] = useState("false");
  const [severityFilter, setSeverityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toasterId = useId("drift-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const fetchDrift = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (resolvedFilter) params.set("resolved", resolvedFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    fetch(`/api/drift?${params}`).then((r) => r.json()).then(setEvents).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrift(); }, [resolvedFilter, severityFilter, sourceFilter]);

  const handleResolve = async (id: string, source: string) => {
    await fetch("/api/drift", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, resolved: true, source }) });
    dispatchToast(<Toast><ToastTitle>Drift resolved</ToastTitle></Toast>, { intent: "success" });
    fetchDrift();
  };

  const sourceCounts = events.reduce((acc, e) => { acc[e.source] = (acc[e.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const severityCounts = events.reduce((acc, e) => { if (!e.resolved) acc[e.severity] = (acc[e.severity] || 0) + 1; return acc; }, {} as Record<string, number>);

  const sevColors: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: "#3A0E14", text: "#F28B8B" },
    HIGH: { bg: "#2E2010", text: "#E8D07A" },
    MEDIUM: { bg: "#2E201080", text: "#E8D07A" },
    LOW: { bg: "#221830", text: "#B89ADA" },
  };

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />
      <div>
        <Text size={700} weight="bold" block>Drift Events</Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          Configuration drift across Infrastructure, M365, and Purview ({events.length} events)
        </Text>
      </div>

      {/* Severity summary */}
      <div className={styles.severityGrid}>
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
          const c = sevColors[sev];
          return (
            <Card key={sev} hover onClick={() => setSeverityFilter(severityFilter === sev ? "" : sev)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ borderRadius: tokens.borderRadiusMedium, backgroundColor: c.bg, padding: 8 }}>
                  <Shield20Regular style={{ color: c.text }} />
                </div>
                <div>
                  <Text size={600} weight="bold" style={{ color: c.text }}>{severityCounts[sev] || 0}</Text>
                  <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>{sev}</Text>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Source + filters */}
      <div className={styles.filterRow}>
        {Object.entries(sourceCounts).map(([src, count]) => {
          const meta = sourceIcons[src] || sourceIcons.infra;
          const Icon = meta.icon;
          const isActive = sourceFilter === src;
          return (
            <button key={src} onClick={() => setSourceFilter(isActive ? "" : src)}
              className={styles.sourceBtn}
              style={isActive ? { backgroundColor: "#221830", borderColor: "#B89ADA50", color: "#B89ADA" } : undefined}
            >
              <Icon style={{ color: meta.color, fontSize: 12 }} /> {meta.label} <Text weight="bold" size={200}>{String(count)}</Text>
            </button>
          );
        })}
        <Select value={resolvedFilter} onChange={(e) => setResolvedFilter((e.target as HTMLSelectElement).value)} appearance="filled-darker" style={{ height: 32 }}>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </Select>
        <Select value={severityFilter} onChange={(e) => setSeverityFilter((e.target as HTMLSelectElement).value)} appearance="filled-darker" style={{ height: 32 }}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </div>

      {/* Events */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner size="large" label="Loading drift events..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={Warning20Regular} title="No drift events" description={resolvedFilter === "false" ? "All systems in desired state." : "No events match filters."} />
      ) : (
        <div className={styles.eventList}>
          {events.map((event) => {
            const isExpanded = expandedId === event.id;
            const meta = sourceIcons[event.source] || sourceIcons.infra;
            const Icon = meta.icon;
            const props = event.differingProperties || [];

            return (
              <Card key={event.id} className={!event.resolved ? styles.unresolvedBorder : undefined}>
                <div className={styles.eventHeader} onClick={() => setExpandedId(isExpanded ? null : event.id)}>
                  <div className={styles.eventLeft}>
                    <StatusDot status={event.severity} pulse={!event.resolved} />
                    <Icon style={{ color: meta.color, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text weight="semibold" size={300}>{event.targetName}</Text>
                        <Badge variant={event.severity.toLowerCase() as any}>{event.severity}</Badge>
                        <Badge variant={event.source === "m365" ? "active" : event.source === "purview" ? "medium" : "default"}>{meta.label}</Badge>
                        {event.resolved && <Badge variant="compliant">Resolved</Badge>}
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {event.resourceType}{event.driftType ? ` · ${event.driftType.replace(/_/g, " ")}` : ""}{event.workload ? ` · ${event.workload}` : ""}
                      </Text>
                    </div>
                  </div>
                  <div className={styles.eventRight}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{timeAgo(event.createdAt)}</Text>
                    {!event.resolved && (
                      <Button appearance="primary" size="small" style={{ backgroundColor: "#2F855A" }}
                        icon={<CheckmarkCircle20Regular />}
                        onClick={(e) => { e.stopPropagation(); handleResolve(event.id, event.source); }}>
                        Resolve
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
                  </div>
                </div>

                {props.length > 0 && !isExpanded && (
                  <div className={styles.propPills}>
                    {props.map((prop: string) => (
                      <span key={prop} className={styles.propPill}>
                        <Warning20Regular style={{ fontSize: 12 }} />{prop}
                      </span>
                    ))}
                  </div>
                )}

                {isExpanded && (
                  <div className={styles.expandedSection}>
                    {props.map((prop: string) => {
                      const explanation = getExplanation(prop) || getGenericExplanation(prop);
                      const desiredVal = event.desiredState?.[prop];
                      const actualVal = event.actualState?.[prop];
                      return (
                        <div key={prop} className={styles.propBlock}>
                          <div className={styles.propHeader}>
                            <Warning20Regular style={{ color: "#F28B8B" }} />
                            <Text weight="semibold" size={300}>{explanation.setting}</Text>
                            <code style={{ fontSize: 10, backgroundColor: `${tokens.colorNeutralStroke1}50`, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{prop}</code>
                          </div>
                          <div className={styles.propBody}>
                            <div className={styles.stateGrid}>
                              <div className={styles.desiredBox}>
                                <Text size={100} weight="semibold" style={{ color: "#7ECC9A", textTransform: "uppercase", letterSpacing: "0.05em" }}>✓ Desired State</Text>
                                <pre style={{ fontSize: 13, fontFamily: "monospace", marginTop: 4, wordBreak: "break-all", whiteSpace: "pre-wrap", color: tokens.colorNeutralForeground1 }}>
                                  {desiredVal !== undefined ? formatValue(desiredVal) : JSON.stringify(event.desiredState, null, 2)}
                                </pre>
                              </div>
                              <div className={styles.actualBox}>
                                <Text size={100} weight="semibold" style={{ color: "#F28B8B", textTransform: "uppercase", letterSpacing: "0.05em" }}>✗ Actual State</Text>
                                <pre style={{ fontSize: 13, fontFamily: "monospace", marginTop: 4, wordBreak: "break-all", whiteSpace: "pre-wrap", color: tokens.colorNeutralForeground1 }}>
                                  {actualVal !== undefined ? formatValue(actualVal) : JSON.stringify(event.actualState, null, 2)}
                                </pre>
                              </div>
                            </div>
                            {desiredVal !== undefined && actualVal !== undefined && (
                              <div className={styles.driftArrow}>
                                <Text style={{ fontFamily: "monospace", color: "#7ECC9A" }}>{formatValue(desiredVal)}</Text>
                                <ArrowRight20Regular style={{ color: "#F28B8B" }} />
                                <Text style={{ fontFamily: "monospace", color: "#F28B8B" }}>{formatValue(actualVal)}</Text>
                                <Text size={200} style={{ marginLeft: 8, color: tokens.colorNeutralForeground3 }}>(drifted from desired)</Text>
                              </div>
                            )}
                            <div className={styles.explanationBox}>
                              <div className={styles.explRow}>
                                <Info20Regular style={{ color: "#B89ADA", flexShrink: 0 }} />
                                <Text size={300}>{explanation.description}</Text>
                              </div>
                              <div className={styles.explRow}>
                                <Warning20Regular style={{ color: "#F28B8B", flexShrink: 0 }} />
                                <div>
                                  <Text size={200} weight="semibold" style={{ color: "#F28B8B" }}>Risk</Text>
                                  <Text size={300} style={{ color: tokens.colorNeutralForeground3 }} block>{explanation.risk}</Text>
                                </div>
                              </div>
                              <div className={styles.explRow}>
                                <Lightbulb20Regular style={{ color: "#E8D07A", flexShrink: 0 }} />
                                <div>
                                  <Text size={200} weight="semibold" style={{ color: "#E8D07A" }}>Recommendation</Text>
                                  <Text size={300} style={{ color: tokens.colorNeutralForeground3 }} block>{explanation.recommendation}</Text>
                                </div>
                              </div>
                              {explanation.docUrl && (
                                <a href={explanation.docUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: "#B89ADA", textDecoration: "none", paddingLeft: 28 }}>
                                  📖 Microsoft Documentation →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {props.length === 0 && (event.desiredState || event.actualState) && (
                      <div className={styles.stateGrid}>
                        <div>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: 4 }} block>Desired State</Text>
                          <pre className="code-editor" style={{ backgroundColor: "#18241C", borderRadius: 8, padding: 12, fontSize: 12, overflow: "auto", maxHeight: 192, border: "1px solid #7ECC9A30" }}>{JSON.stringify(event.desiredState, null, 2)}</pre>
                        </div>
                        <div>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: 4 }} block>Actual State</Text>
                          <pre className="code-editor" style={{ backgroundColor: "#3A0E14", borderRadius: 8, padding: 12, fontSize: 12, overflow: "auto", maxHeight: 192, border: "1px solid #F28B8B30" }}>{JSON.stringify(event.actualState, null, 2)}</pre>
                        </div>
                      </div>
                    )}
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

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}
