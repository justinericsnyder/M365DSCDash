"use client";

import { useEffect, useState, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Cloud20Regular,
  Shield20Regular,
  Mail20Regular,
  ShareAndroid20Regular,
  People20Regular,
  LockClosed20Regular,
  Phone20Regular,
  ShieldCheckmark20Regular,
  HardDrive20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  ChevronRight20Regular,
  Database20Regular,
  ArrowSync20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

const WORKLOAD_META: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  AAD: { label: "Entra ID (AAD)", icon: Shield20Regular, color: "#B89ADA", bgColor: "#221830" },
  EXO: { label: "Exchange Online", icon: Mail20Regular, color: "#F28B8B", bgColor: "#3A0E14" },
  SPO: { label: "SharePoint Online", icon: ShareAndroid20Regular, color: "#7ECC9A", bgColor: "#18241C" },
  TEAMS: { label: "Microsoft Teams", icon: People20Regular, color: "#7C3AED", bgColor: "#2D1B69" },
  SC: { label: "Security & Compliance", icon: LockClosed20Regular, color: "#E8D07A", bgColor: "#2E2010" },
  INTUNE: { label: "Intune", icon: Phone20Regular, color: "#06b6d4", bgColor: "#0e2a2f" },
  DEFENDER: { label: "Defender", icon: ShieldCheckmark20Regular, color: "#f97316", bgColor: "#2E1A0A" },
  OD: { label: "OneDrive", icon: HardDrive20Regular, color: "#B89ADA", bgColor: "#221830" },
};

interface DashboardData {
  hasTenant: boolean;
  tenant?: {
    id: string;
    displayName: string;
    tenantName: string;
    defaultDomain: string;
    lastExport: string;
    lastDriftCheck: string;
  };
  totals?: { resources: number; compliant: number; drifted: number; complianceRate: number };
  workloads?: Record<string, { total: number; compliant: number; drifted: number }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  driftedResources?: any[];
  resourceTypes?: { type: string; count: number }[];
}

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "64px",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    textAlign: "center",
  },
  emptyIcon: {
    borderRadius: "9999px",
    backgroundColor: "#221830",
    padding: "24px",
    marginBottom: "24px",
  },
  emptyButtons: {
    display: "flex",
    gap: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerButtons: {
    display: "flex",
    gap: "8px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  kpiCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  kpiIconBox: {
    borderRadius: tokens.borderRadiusMedium,
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workloadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
  workloadCardInner: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  workloadLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  workloadIconBox: {
    borderRadius: tokens.borderRadiusMedium,
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: "8px",
    borderRadius: "4px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    overflow: "hidden",
  },
  progressFill: {
    height: "8px",
    borderRadius: "4px",
    transitionProperty: "width",
    transitionDuration: "300ms",
  },
  workloadFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
  },
  driftRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  driftRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  driftResourceIcon: {
    borderRadius: tokens.borderRadiusSmall,
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  driftRowRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  driftList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  linkUnstyled: {
    textDecoration: "none",
    color: "inherit",
  },
});

export default function M365Page() {
  const styles = useStyles();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const toasterId = useId("m365-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/m365/dashboard");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/m365/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        dispatchToast(
          <Toast><ToastTitle>Loaded {json.summary.resources} M365 resources across {json.summary.workloads} workloads</ToastTitle></Toast>,
          { intent: "success" }
        );
        fetchData();
      } else {
        dispatchToast(
          <Toast><ToastTitle>{json.error || "Seed failed"}</ToastTitle></Toast>,
          { intent: "error" }
        );
      }
    } catch {
      dispatchToast(
        <Toast><ToastTitle>Failed to seed M365 data</ToastTitle></Toast>,
        { intent: "error" }
      );
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Toaster toasterId={toasterId} />
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading M365 dashboard..." />
        </div>
      </div>
    );
  }

  if (!data?.hasTenant) {
    return (
      <div className={styles.emptyContainer}>
        <Toaster toasterId={toasterId} />
        <div className={styles.emptyIcon}>
          <Cloud20Regular style={{ fontSize: 48, color: "#B89ADA" }} />
        </div>
        <Text size={700} weight="bold" block style={{ marginBottom: 8 }}>Microsoft 365 DSC</Text>
        <Text size={400} style={{ color: tokens.colorNeutralForeground3, maxWidth: 480, marginBottom: 32 }} block>
          Import your Microsoft365DSC export to visualize tenant configuration compliance across
          Entra ID, Exchange, SharePoint, Teams, Intune, and more.
        </Text>
        <div className={styles.emptyButtons}>
          <Button appearance="primary" size="large" icon={<Database20Regular />} onClick={handleSeed} disabled={seeding}>
            {seeding ? "Loading..." : "Load Demo Tenant"}
          </Button>
          <Link href="/m365/import" className={styles.linkUnstyled}>
            <Button appearance="outline" size="large">Import JSON Report</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { tenant, totals, workloads, driftedResources } = data;

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <Text size={700} weight="bold">Microsoft 365 DSC</Text>
            <Badge variant="active">{tenant?.displayName}</Badge>
          </div>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {tenant?.tenantName} · Last export {timeAgo(tenant?.lastExport)}
          </Text>
        </div>
        <div className={styles.headerButtons}>
          <Link href="/m365/resources" className={styles.linkUnstyled}>
            <Button appearance="outline">View All Resources</Button>
          </Link>
          <Link href="/m365/import" className={styles.linkUnstyled}>
            <Button appearance="outline">Import Report</Button>
          </Link>
          <Button
            appearance="subtle"
            icon={<ArrowSync20Regular style={seeding ? { animation: "spin 1s linear infinite" } : undefined} />}
            onClick={handleSeed}
            disabled={seeding}
          />
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#221830" }}>
              <Cloud20Regular style={{ color: "#B89ADA" }} />
            </div>
            <div>
              <Text size={700} weight="bold" block>{totals?.resources}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Total Resources</Text>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#18241C" }}>
              <CheckmarkCircle20Regular style={{ color: "#7ECC9A" }} />
            </div>
            <div>
              <Text size={700} weight="bold" style={{ color: "#7ECC9A" }} block>{totals?.complianceRate}%</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Compliance Rate</Text>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#18241C" }}>
              <CheckmarkCircle20Regular style={{ color: "#7ECC9A" }} />
            </div>
            <div>
              <Text size={700} weight="bold" block>{totals?.compliant}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Compliant</Text>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconBox} style={{ backgroundColor: "#3A0E14" }}>
              <DismissCircle20Regular style={{ color: "#F28B8B" }} />
            </div>
            <div>
              <Text size={700} weight="bold" style={{ color: "#F28B8B" }} block>{totals?.drifted}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Drifted</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Workload Cards */}
      <div>
        <Text size={500} weight="semibold" block style={{ marginBottom: 12 }}>Workload Compliance</Text>
        <div className={styles.workloadGrid}>
          {Object.entries(workloads || {}).map(([key, wl]) => {
            const meta = WORKLOAD_META[key] || { label: key, icon: Cloud20Regular, color: tokens.colorNeutralForeground3, bgColor: tokens.colorNeutralBackground2 };
            const Icon = meta.icon;
            const pct = wl.total > 0 ? Math.round((wl.compliant / wl.total) * 100) : 100;
            return (
              <Link key={key} href={`/m365/resources?workload=${key}`} className={styles.linkUnstyled}>
                <Card hover>
                  <div className={styles.workloadCardInner}>
                    <div className={styles.workloadLeft}>
                      <div className={styles.workloadIconBox} style={{ backgroundColor: meta.bgColor }}>
                        <Icon style={{ color: meta.color }} />
                      </div>
                      <div>
                        <Text size={300} weight="semibold" block>{meta.label}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{wl.total} resources</Text>
                      </div>
                    </div>
                    <ChevronRight20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "#7ECC9A" : pct >= 80 ? "#E8D07A" : "#F28B8B",
                      }}
                    />
                  </div>
                  <div className={styles.workloadFooter}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{pct}% compliant</Text>
                    {wl.drifted > 0 && (
                      <Text size={200} weight="medium" style={{ color: "#F28B8B" }}>{wl.drifted} drifted</Text>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Drifted Resources */}
      {driftedResources && driftedResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DismissCircle20Regular style={{ color: "#F28B8B" }} />
                Configuration Drift ({driftedResources.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.driftList}>
              {driftedResources.map((res) => {
                const meta = WORKLOAD_META[res.workload] || WORKLOAD_META.AAD;
                const Icon = meta.icon;
                return (
                  <div key={res.id} className={styles.driftRow}>
                    <div className={styles.driftRowLeft}>
                      <StatusDot status="DRIFTED" pulse />
                      <div className={styles.driftResourceIcon} style={{ backgroundColor: meta.bgColor }}>
                        <Icon style={{ color: meta.color, fontSize: 14 }} />
                      </div>
                      <div>
                        <Text size={300} weight="medium" block>{res.displayName}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{res.resourceType}</Text>
                      </div>
                    </div>
                    <div className={styles.driftRowRight}>
                      {res.differingProperties?.map((p: string) => (
                        <Badge key={p} variant="drifted">{p}</Badge>
                      ))}
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{timeAgo(res.lastChecked)}</Text>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
