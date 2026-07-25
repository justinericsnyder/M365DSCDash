"use client";

import { useEffect, useState, useCallback } from "react";
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
  Bot20Regular,
  Shield20Regular,
  ShieldError20Regular,
  Pin20Regular,
  ProhibitedMultiple20Regular,
  Rocket20Regular,
  Building20Regular,
  ShareAndroid20Regular,
  Search20Regular,
  Warning20Regular,
  DocumentText20Regular,
  PersonDelete20Regular,
  Database20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

const useStyles = makeStyles({
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "16rem",
  },
  emptyStateContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    textAlign: "center",
  },
  emptyStateIcon: {
    borderRadius: "9999px",
    backgroundColor: "#2D1B4E",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  emptyStateTitle: {
    marginBottom: "0.5rem",
  },
  emptyStateDescription: {
    color: tokens.colorNeutralForeground3,
    maxWidth: "32rem",
    marginBottom: "2rem",
  },
  codeSnippet: {
    fontSize: "0.75rem",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    paddingLeft: "0.25rem",
    paddingRight: "0.25rem",
    borderRadius: "0.25rem",
  },
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: "0.25rem",
  },
  viewButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
  },
  governanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
  cardFlexRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  iconContainerPurple: {
    borderRadius: "0.5rem",
    backgroundColor: "#2D1B4E",
    padding: "0.5rem",
  },
  iconContainerBlue: {
    borderRadius: "0.5rem",
    backgroundColor: "#221830",
    padding: "0.5rem",
  },
  iconContainerGreen: {
    borderRadius: "0.5rem",
    backgroundColor: "#18241C",
    padding: "0.5rem",
  },
  iconContainerRed: {
    borderRadius: "0.5rem",
    backgroundColor: "#3A0E14",
    padding: "0.5rem",
  },
  iconContainerYellow: {
    borderRadius: "0.5rem",
    backgroundColor: "#2E2010",
    padding: "0.5rem",
  },
  iconContainerOrange: {
    borderRadius: "0.5rem",
    backgroundColor: "#2E2010",
    padding: "0.5rem",
  },
  iconPurple: {
    color: "#7C3AED",
  },
  iconBlue: {
    color: "#B89ADA",
  },
  iconGreen: {
    color: "#7ECC9A",
  },
  iconRed: {
    color: "#F28B8B",
  },
  iconYellow: {
    color: "#E8D07A",
  },
  iconOrange: {
    color: "#F97316",
  },
  kpiValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: tokens.colorNeutralForeground1,
  },
  kpiLabel: {
    fontSize: "0.75rem",
    color: tokens.colorNeutralForeground3,
  },
  kpiSub: {
    fontSize: "0.625rem",
    color: tokens.colorNeutralForeground3,
  },
  kpiIconContainer: {
    borderRadius: "0.5rem",
    padding: "0.625rem",
  },
  kpiIcon: {
    width: "1.25rem",
    height: "1.25rem",
  },
  recentAgentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  recentAgentLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  recentAgentIconWrapper: {
    borderRadius: "0.375rem",
    padding: "0.375rem",
  },
  recentAgentRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  pinnedIcon: {
    color: "#7ECC9A",
  },
  hostTag: {
    fontSize: "0.625rem",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    color: tokens.colorNeutralForeground3,
    paddingLeft: "0.375rem",
    paddingRight: "0.375rem",
    paddingTop: "0.125rem",
    paddingBottom: "0.125rem",
    borderRadius: "0.25rem",
  },
  filtersRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    alignItems: "center",
  },
  searchWrapper: {
    position: "relative" as const,
    width: "16rem",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: tokens.colorNeutralForeground3,
  },
  searchInput: {
    height: "2.25rem",
    width: "100%",
    borderRadius: "0.5rem",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    paddingLeft: "2.25rem",
    paddingRight: "0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    color: tokens.colorNeutralForeground1,
  },
  selectControl: {
    minWidth: "auto",
  },
  clearButton: {
    fontSize: "0.75rem",
    color: "#B89ADA",
    cursor: "pointer",
    background: "none",
    border: "none",
    alignSelf: "center",
    ":hover": {
      textDecorationLine: "underline",
    },
  },
  agentList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  agentCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  agentCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  agentCardRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  agentHostBadges: {
    display: "flex",
    gap: "0.25rem",
  },
  deploymentStatus: {
    textAlign: "right" as const,
    fontSize: "0.75rem",
  },
  deployedText: {
    color: "#7ECC9A",
    fontWeight: "500",
  },
  notDeployedText: {
    color: tokens.colorNeutralForeground3,
  },
  availableText: {
    color: tokens.colorNeutralForeground3,
  },
  expandedDetails: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    fontSize: "0.875rem",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
  detailLabel: {
    fontSize: "0.75rem",
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: "500",
    color: tokens.colorNeutralForeground1,
  },
  detailValueMono: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: tokens.colorNeutralForeground3,
  },
  detailTags: {
    display: "flex",
    gap: "0.25rem",
    marginTop: "0.125rem",
    flexWrap: "wrap",
  },
  hostTagBlue: {
    fontSize: "0.625rem",
    backgroundColor: "#221830",
    color: "#B89ADA",
    paddingLeft: "0.375rem",
    paddingRight: "0.375rem",
    paddingTop: "0.125rem",
    paddingBottom: "0.125rem",
    borderRadius: "0.25rem",
  },
  pinnedBadge: {
    color: "#7ECC9A",
    display: "flex",
    alignItems: "center",
    gap: "0.125rem",
    fontSize: "0.75rem",
  },
  riskBadgeIcon: {
    marginRight: "0.125rem",
  },
  knowledgeValue: {
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    color: tokens.colorNeutralForeground1,
  },
  recentAgentsSpace: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
});

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  MICROSOFT: { label: "Microsoft", icon: Shield20Regular, color: "blue", bgColor: "blue" },
  EXTERNAL: { label: "External", icon: Building20Regular, color: "orange", bgColor: "orange" },
  CUSTOM: { label: "Custom", icon: Bot20Regular, color: "purple", bgColor: "purple" },
  SHARED: { label: "Shared", icon: ShareAndroid20Regular, color: "green", bgColor: "green" },
};

interface Agent {
  id: string;
  packageId: string;
  displayName: string;
  type: string;
  shortDescription: string | null;
  publisher: string | null;
  isBlocked: boolean;
  supportedHosts: string[];
  elementTypes: string[];
  platform: string | null;
  version: string | null;
  availableTo: string;
  deployedTo: string;
  isPinned: boolean;
  pinnedScope: string | null;
  riskCount: number;
  hasEmbeddedFiles: boolean;
  sensitivityLabel: string | null;
  ownerDisplayName: string | null;
  isOwnerless: boolean;
  lastModifiedDateTime: string | null;
}

interface DashboardData {
  hasTenant: boolean;
  hasAgents?: boolean;
  tenant?: { displayName: string; tenantName: string };
  totals?: {
    total: number; microsoft: number; external: number; custom: number; shared: number;
    blocked: number; deployed: number; pinned: number; withRisks: number;
    totalRiskCount: number; ownerless: number; withEmbeddedFiles: number;
  };
  recentAgents?: Agent[];
}

export default function AgentsPage() {
  const styles = useStyles();
  const toasterId = useId("agents-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hostFilter, setHostFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "list">("dashboard");

  const fetchDashboard = useCallback(async () => {
    const res = await fetch("/api/agents/dashboard");
    const json = await res.json();
    setDashboard(json);
  }, []);

  const fetchAgents = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter === "blocked") params.set("blocked", "true");
    if (statusFilter === "deployed") params.set("deployed", "deployed");
    if (statusFilter === "not_deployed") params.set("deployed", "not_deployed");
    if (hostFilter) params.set("host", hostFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/agents?${params}`);
    const json = await res.json();
    setAgents(json);
  }, [typeFilter, statusFilter, hostFilter, search]);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAgents()]).finally(() => setLoading(false));
  }, [fetchDashboard, fetchAgents]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/agents/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        dispatchToast(
          <Toast><ToastTitle>{`Loaded ${json.summary.total} agents`}</ToastTitle></Toast>,
          { intent: "success" }
        );
        await Promise.all([fetchDashboard(), fetchAgents()]);
      } else {
        dispatchToast(
          <Toast><ToastTitle>{json.error || "Seed failed"}</ToastTitle></Toast>,
          { intent: "error" }
        );
      }
    } catch {
      dispatchToast(
        <Toast><ToastTitle>Failed to seed agents</ToastTitle></Toast>,
        { intent: "error" }
      );
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
      </div>
    );
  }

  if (!dashboard?.hasAgents) {
    return (
      <div className={styles.emptyStateContainer}>
        <Toaster toasterId={toasterId} />
        <div className={styles.emptyStateIcon}>
          <Bot20Regular style={{ width: "3rem", height: "3rem", color: "#7C3AED" }} />
        </div>
        <Text size={700} weight="bold" className={styles.emptyStateTitle}>Agent 365 Registry</Text>
        <Text className={styles.emptyStateDescription}>
          View and manage Copilot agents across your tenant — Microsoft, external partner, custom, and shared agents.
          Data sourced from the Graph API <code className={styles.codeSnippet}>GET /beta/copilot/admin/catalog/packages</code>.
        </Text>
        <Button appearance="primary" onClick={handleSeed} disabled={seeding} size="large"
          icon={<Database20Regular />}>
          {seeding ? "Loading..." : "Load Demo Agents"}
        </Button>
      </div>
    );
  }

  const t = dashboard.totals!;

  const getIconContainerClass = (color: string) => {
    switch (color) {
      case "purple": return styles.iconContainerPurple;
      case "blue": return styles.iconContainerBlue;
      case "green": return styles.iconContainerGreen;
      case "red": return styles.iconContainerRed;
      case "yellow": return styles.iconContainerYellow;
      case "orange": return styles.iconContainerOrange;
      default: return styles.iconContainerBlue;
    }
  };

  const getIconColorClass = (color: string) => {
    switch (color) {
      case "purple": return styles.iconPurple;
      case "blue": return styles.iconBlue;
      case "green": return styles.iconGreen;
      case "red": return styles.iconRed;
      case "yellow": return styles.iconYellow;
      case "orange": return styles.iconOrange;
      default: return styles.iconBlue;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Toaster toasterId={toasterId} />

      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitleRow}>
            <Text size={700} weight="bold">Agent 365 Registry</Text>
            <Badge variant="active">{dashboard.tenant?.displayName}</Badge>
          </div>
          <Text size={200} className={styles.headerSubtitle}>
            {t.total} agents · via Graph API <code className={styles.codeSnippet}>/beta/copilot/admin/catalog/packages</code>
          </Text>
        </div>
        <div className={styles.viewButtons}>
          <Button appearance={view === "dashboard" ? "primary" : "outline"} size="small" onClick={() => setView("dashboard")}>Overview</Button>
          <Button appearance={view === "list" ? "primary" : "outline"} size="small" onClick={() => setView("list")}>All Agents</Button>
        </div>
      </div>

      {view === "dashboard" ? (
        <>
          {/* KPI Row */}
          <div className={styles.kpiGrid}>
            <KPI icon={Bot20Regular} label="Total Agents" value={t.total} color="purple" />
            <KPI icon={Rocket20Regular} label="Deployed" value={t.deployed} color="blue" />
            <KPI icon={Pin20Regular} label="Pinned" value={t.pinned} color="green" />
            <KPI icon={ShieldError20Regular} label="With Risks" value={t.withRisks} color="red" sub={`${t.totalRiskCount} total risks`} />
          </div>

          {/* Type Breakdown */}
          <div className={styles.typeGrid}>
            {(["MICROSOFT", "EXTERNAL", "CUSTOM", "SHARED"] as const).map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              const count = type === "MICROSOFT" ? t.microsoft : type === "EXTERNAL" ? t.external : type === "CUSTOM" ? t.custom : t.shared;
              return (
                <Card key={type} hover className="cursor-pointer" onClick={() => { setTypeFilter(type); setView("list"); }}>
                  <div className={styles.cardFlexRow}>
                    <div className={getIconContainerClass(meta.bgColor)}>
                      <Icon className={getIconColorClass(meta.color)} />
                    </div>
                    <div>
                      <Text size={600} weight="bold">{count}</Text>
                      <Text size={200} className={styles.kpiLabel}>{meta.label}</Text>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Governance Alerts */}
          <div className={styles.governanceGrid}>
            {t.blocked > 0 && (
              <Card>
                <div className={styles.cardFlexRow}>
                  <div className={styles.iconContainerRed}>
                    <ProhibitedMultiple20Regular className={styles.iconRed} />
                  </div>
                  <div>
                    <Text weight="semibold">{t.blocked} Blocked</Text>
                    <Text size={200} className={styles.kpiLabel}>Agents restricted from use</Text>
                  </div>
                </div>
              </Card>
            )}
            {t.ownerless > 0 && (
              <Card>
                <div className={styles.cardFlexRow}>
                  <div className={styles.iconContainerYellow}>
                    <PersonDelete20Regular className={styles.iconYellow} />
                  </div>
                  <div>
                    <Text weight="semibold">{t.ownerless} Ownerless</Text>
                    <Text size={200} className={styles.kpiLabel}>Need ownership reassignment</Text>
                  </div>
                </div>
              </Card>
            )}
            {t.withEmbeddedFiles > 0 && (
              <Card>
                <div className={styles.cardFlexRow}>
                  <div className={styles.iconContainerPurple}>
                    <DocumentText20Regular className={styles.iconPurple} />
                  </div>
                  <div>
                    <Text weight="semibold">{t.withEmbeddedFiles} With Embedded Files</Text>
                    <Text size={200} className={styles.kpiLabel}>Using file knowledge sources</Text>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Recent Agents */}
          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitleRow}>
                <Bot20Regular className={styles.iconPurple} />
                Recently Modified Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.recentAgentsSpace}>
                {dashboard.recentAgents?.slice(0, 8).map((agent) => {
                  const meta = TYPE_META[agent.type] || TYPE_META.CUSTOM;
                  const Icon = meta.icon;
                  return (
                    <div key={agent.id} className={styles.recentAgentRow}>
                      <div className={styles.recentAgentLeft}>
                        <div className={`${styles.recentAgentIconWrapper} ${getIconContainerClass(meta.bgColor)}`}>
                          <Icon className={getIconColorClass(meta.color)} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Text size={300} weight="medium">{agent.displayName}</Text>
                            {agent.isBlocked && <Badge variant="error">Blocked</Badge>}
                            {agent.isPinned && <span className={styles.pinnedIcon}><Pin20Regular style={{ width: "0.75rem", height: "0.75rem" }} /></span>}
                          </div>
                          <Text size={200} className={styles.kpiLabel}>{agent.publisher}</Text>
                        </div>
                      </div>
                      <div className={styles.recentAgentRight}>
                        {agent.riskCount > 0 && <Badge variant="critical">{agent.riskCount} risks</Badge>}
                        <Badge variant={meta.label.toLowerCase() as "default"}>{meta.label}</Badge>
                        {agent.supportedHosts.map((h) => (
                          <span key={h} className={styles.hostTag}>{h}</span>
                        ))}
                        <Text size={200} className={styles.kpiLabel}>{timeAgo(agent.lastModifiedDateTime)}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Filters */}
          <div className={styles.filtersRow}>
            <div className={styles.searchWrapper}>
              <Search20Regular className={styles.searchIcon} style={{ width: "1rem", height: "1rem" }} />
              <input
                type="text"
                placeholder="Search agents..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              appearance="filled-darker"
              className={styles.selectControl}
              value={typeFilter}
              onChange={(_, data) => setTypeFilter(data.value)}
            >
              <option value="">All Types</option>
              <option value="MICROSOFT">Microsoft</option>
              <option value="EXTERNAL">External</option>
              <option value="CUSTOM">Custom</option>
              <option value="SHARED">Shared</option>
            </Select>
            <Select
              appearance="filled-darker"
              className={styles.selectControl}
              value={statusFilter}
              onChange={(_, data) => setStatusFilter(data.value)}
            >
              <option value="">All Statuses</option>
              <option value="deployed">Deployed</option>
              <option value="not_deployed">Not Deployed</option>
              <option value="blocked">Blocked</option>
            </Select>
            <Select
              appearance="filled-darker"
              className={styles.selectControl}
              value={hostFilter}
              onChange={(_, data) => setHostFilter(data.value)}
            >
              <option value="">All Hosts</option>
              <option value="Copilot">Copilot</option>
              <option value="Teams">Teams</option>
              <option value="Outlook">Outlook</option>
              <option value="Word">Word</option>
              <option value="Excel">Excel</option>
            </Select>
            {(typeFilter || statusFilter || hostFilter || search) && (
              <button className={styles.clearButton} onClick={() => { setTypeFilter(""); setStatusFilter(""); setHostFilter(""); setSearch(""); }}>Clear</button>
            )}
          </div>

          {/* Agent List */}
          {agents.length === 0 ? (
            <EmptyState icon={Bot20Regular} title="No agents found" description="Adjust your filters or load demo data." />
          ) : (
            <div className={styles.agentList}>
              {agents.map((agent) => {
                const meta = TYPE_META[agent.type] || TYPE_META.CUSTOM;
                const Icon = meta.icon;
                const isExpanded = expandedId === agent.id;
                return (
                  <Card key={agent.id}>
                    <div className={styles.agentCardHeader} onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                      <div className={styles.agentCardLeft}>
                        <div className={getIconContainerClass(meta.bgColor)}>
                          <Icon className={getIconColorClass(meta.color)} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Text weight="semibold">{agent.displayName}</Text>
                            {agent.isBlocked && <Badge variant="error">Blocked</Badge>}
                            {agent.isPinned && <span className={styles.pinnedBadge}><Pin20Regular style={{ width: "0.75rem", height: "0.75rem" }} />Pinned</span>}
                            {agent.isOwnerless && <Badge variant="drifted">Ownerless</Badge>}
                            {agent.riskCount > 0 && <Badge variant="critical"><Warning20Regular style={{ width: "0.75rem", height: "0.75rem" }} className={styles.riskBadgeIcon} />{agent.riskCount} risks</Badge>}
                          </div>
                          <Text size={200} className={styles.kpiLabel}>{agent.shortDescription}</Text>
                        </div>
                      </div>
                      <div className={styles.agentCardRight}>
                        <div className={styles.agentHostBadges}>
                          {agent.supportedHosts.slice(0, 3).map((h) => (
                            <span key={h} className={styles.hostTag}>{h}</span>
                          ))}
                          {agent.supportedHosts.length > 3 && <Text size={200} className={styles.kpiLabel}>+{agent.supportedHosts.length - 3}</Text>}
                        </div>
                        <Badge variant={meta.label.toLowerCase() as "default"}>{meta.label}</Badge>
                        <div className={styles.deploymentStatus}>
                          <Text size={200} className={agent.deployedTo !== "none" ? styles.deployedText : styles.notDeployedText}>
                            {agent.deployedTo !== "none" ? `Deployed: ${agent.deployedTo}` : "Not deployed"}
                          </Text>
                          <Text size={200} className={styles.availableText}>Available: {agent.availableTo}</Text>
                        </div>
                        {isExpanded
                          ? <ChevronUp20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                          : <ChevronDown20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                        }
                      </div>
                    </div>
                    {isExpanded && (
                      <div className={styles.expandedDetails}>
                        <div><Text className={styles.detailLabel}>Publisher</Text><Text className={styles.detailValue}>{agent.publisher || "—"}</Text></div>
                        <div><Text className={styles.detailLabel}>Version</Text><Text className={styles.detailValue}>{agent.version || "—"}</Text></div>
                        <div><Text className={styles.detailLabel}>Platform</Text><Text className={styles.detailValue}>{agent.platform || "web"}</Text></div>
                        <div><Text className={styles.detailLabel}>Last Modified</Text><Text className={styles.detailValue}>{timeAgo(agent.lastModifiedDateTime)}</Text></div>
                        <div><Text className={styles.detailLabel}>Element Types</Text><div className={styles.detailTags}>{agent.elementTypes.map((e) => <span key={e} className={styles.hostTag}>{e}</span>)}</div></div>
                        <div><Text className={styles.detailLabel}>Hosts</Text><div className={styles.detailTags}>{agent.supportedHosts.map((h) => <span key={h} className={styles.hostTagBlue}>{h}</span>)}</div></div>
                        {agent.ownerDisplayName && <div><Text className={styles.detailLabel}>Owner</Text><Text className={styles.detailValue}>{agent.ownerDisplayName}</Text></div>}
                        {agent.sensitivityLabel && <div><Text className={styles.detailLabel}>Sensitivity</Text><Badge variant={agent.sensitivityLabel === "Highly Confidential" ? "critical" : agent.sensitivityLabel === "Confidential" ? "high" : "medium"}>{agent.sensitivityLabel}</Badge></div>}
                        {agent.hasEmbeddedFiles && <div><Text className={styles.detailLabel}>Knowledge</Text><Text className={styles.knowledgeValue}><DocumentText20Regular style={{ width: "0.75rem", height: "0.75rem" }} />Embedded files</Text></div>}
                        <div><Text className={styles.detailLabel}>Package ID</Text><Text className={styles.detailValueMono}>{agent.packageId}</Text></div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number; color: string; sub?: string }) {
  const styles = useStyles();

  const getKpiBg = (c: string) => {
    switch (c) {
      case "purple": return styles.iconContainerPurple;
      case "blue": return styles.iconContainerBlue;
      case "green": return styles.iconContainerGreen;
      case "red": return styles.iconContainerRed;
      default: return styles.iconContainerBlue;
    }
  };

  const getKpiColor = (c: string) => {
    switch (c) {
      case "purple": return styles.iconPurple;
      case "blue": return styles.iconBlue;
      case "green": return styles.iconGreen;
      case "red": return styles.iconRed;
      default: return styles.iconBlue;
    }
  };

  return (
    <Card>
      <div className={styles.cardFlexRow}>
        <div className={`${styles.kpiIconContainer} ${getKpiBg(color)}`}>
          <Icon className={`${styles.kpiIcon} ${getKpiColor(color)}`} />
        </div>
        <div>
          <Text className={styles.kpiValue}>{value}</Text>
          <Text className={styles.kpiLabel}>{label}</Text>
          {sub && <Text className={styles.kpiSub}>{sub}</Text>}
        </div>
      </div>
    </Card>
  );
}
