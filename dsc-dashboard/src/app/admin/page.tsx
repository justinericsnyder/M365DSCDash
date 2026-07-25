"use client";

import { useEffect, useState, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Select,
  Input,
  Spinner,
  TabList,
  Tab,
  Switch,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Shield20Regular,
  PersonAvailable20Regular,
  PersonDelete20Regular,
  People20Regular,
  Clock20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  Crown20Regular,
  ProhibitedMultiple20Regular,
  Settings20Regular,
  DocumentBulletList20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Filter20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isApproved: boolean;
  approvedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { sessions: number; tenants: number };
}

interface AuditEntry {
  id: string;
  action: string;
  userId: string | null;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  success: boolean;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; variant: "compliant" | "drifted" | "active" | "default" }> = {
  LOGIN_SUCCESS: { label: "Login", variant: "compliant" },
  LOGIN_FAILED: { label: "Login Failed", variant: "drifted" },
  LOGOUT: { label: "Logout", variant: "default" },
  REGISTER: { label: "Register", variant: "active" },
  PASSWORD_CHANGED: { label: "Password Changed", variant: "active" },
  PASSWORD_CHANGE_FAILED: { label: "Password Change Failed", variant: "drifted" },
  SESSION_CREATED: { label: "Session Created", variant: "default" },
  SESSION_REVOKED: { label: "Session Revoked", variant: "drifted" },
  ACCOUNT_LOCKED: { label: "Account Locked", variant: "drifted" },
  ACCOUNT_APPROVED: { label: "Approved", variant: "compliant" },
  ACCOUNT_REJECTED: { label: "Rejected", variant: "drifted" },
  ADMIN_PROMOTE: { label: "Promoted", variant: "active" },
  ADMIN_DEMOTE: { label: "Demoted", variant: "drifted" },
  TENANT_CONNECTED: { label: "Tenant Connected", variant: "compliant" },
  TENANT_DISCONNECTED: { label: "Tenant Disconnected", variant: "drifted" },
  SYNC_TRIGGERED: { label: "Sync", variant: "active" },
};

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" },
  headerRow: { display: "flex", alignItems: "center", gap: "8px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  statCell: { display: "flex", alignItems: "center", gap: "12px" },
  statIcon: { borderRadius: tokens.borderRadiusMedium, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  flagRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px",
    borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  pendingCard: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px",
    borderRadius: tokens.borderRadiusMedium, backgroundColor: "#2E201050",
    border: "1px solid #E8D07A30",
  },
  pendingAvatar: {
    height: "40px", width: "40px", borderRadius: "9999px",
    backgroundColor: "#E8D07A30", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#E8D07A", fontWeight: tokens.fontWeightBold,
  },
  table: { width: "100%", fontSize: tokens.fontSizeBase200, borderCollapse: "collapse" },
  th: {
    textAlign: "left", padding: "10px 12px", fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground3, borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  td: { padding: "10px 12px", borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  trHover: { ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover } },
  filterRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  buttonGroup: { display: "flex", gap: "4px" },
});

export default function AdminPage() {
  const styles = useStyles();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({ showNodes: true, showConfigurations: true, showImport: true });
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditEmailFilter, setAuditEmailFilter] = useState("");
  const toasterId = useId("admin-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
      else setError(data.error || "Failed to load users");
    } catch { setError("Failed to load users"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/admin/flags").then((r) => r.json()).then((data) => {
      if (data.flags) setFlags(data.flags);
    }).catch(() => {});
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: "30" });
      if (auditFilter) params.set("action", auditFilter);
      if (auditEmailFilter) params.set("email", auditEmailFilter);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (data.logs) { setAuditLogs(data.logs); setAuditPages(data.pages); setAuditTotal(data.total); }
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  }, [auditPage, auditFilter, auditEmailFilter]);

  useEffect(() => { if (tab === "audit") fetchAuditLogs(); }, [tab, fetchAuditLogs]);

  const handleToggleFlag = async (flag: string) => {
    setTogglingFlag(flag);
    try {
      const res = await fetch("/api/admin/flags", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flag, enabled: !flags[flag] }) });
      const data = await res.json();
      if (data.success) { setFlags(data.flags); dispatchToast(<Toast><ToastTitle>{flag} {data.flags[flag] ? "enabled" : "disabled"}</ToastTitle></Toast>, { intent: "success" }); }
      else dispatchToast(<Toast><ToastTitle>{data.error}</ToastTitle></Toast>, { intent: "error" });
    } catch { dispatchToast(<Toast><ToastTitle>Failed to toggle</ToastTitle></Toast>, { intent: "error" }); }
    finally { setTogglingFlag(null); }
  };

  const handleAction = async (userId: string, action: string, label: string) => {
    if (action === "reject" && !confirm("Are you sure you want to reject and remove this user?")) return;
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
      const data = await res.json();
      if (data.success) { dispatchToast(<Toast><ToastTitle>{data.message}</ToastTitle></Toast>, { intent: "success" }); fetchUsers(); }
      else dispatchToast(<Toast><ToastTitle>{data.error}</ToastTitle></Toast>, { intent: "error" });
    } catch { dispatchToast(<Toast><ToastTitle>Failed to {label}</ToastTitle></Toast>, { intent: "error" }); }
  };

  const pending = users.filter((u) => u.role === "PENDING" && !u.isApproved);
  const approved = users.filter((u) => u.isApproved);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size="large" /></div>;
  if (error) return <div style={{ textAlign: "center", padding: 64, color: "#F28B8B" }}><Text>{error}</Text></div>;

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />
      <div>
        <div className={styles.headerRow}>
          <Text size={700} weight="bold">Admin Panel</Text>
          <Badge variant="active">Admin</Badge>
        </div>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>Manage user accounts, access approvals, and security audit trail</Text>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as "users" | "audit")}>
        <Tab value="users" icon={<People20Regular />}>Users &amp; Settings</Tab>
        <Tab value="audit" icon={<DocumentBulletList20Regular />}>Audit Log{auditTotal ? ` (${auditTotal})` : ""}</Tab>
      </TabList>

      {tab === "users" && (
        <>
          {/* Stats */}
          <div className={styles.statsGrid}>
            <Card><div className={styles.statCell}><div className={styles.statIcon} style={{ backgroundColor: "#221830" }}><People20Regular style={{ color: "#B89ADA" }} /></div><div><Text size={600} weight="bold">{users.length}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Total Users</Text></div></div></Card>
            <Card><div className={styles.statCell}><div className={styles.statIcon} style={{ backgroundColor: "#2E2010" }}><Clock20Regular style={{ color: "#E8D07A" }} /></div><div><Text size={600} weight="bold" style={{ color: "#E8D07A" }}>{pending.length}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Pending</Text></div></div></Card>
            <Card><div className={styles.statCell}><div className={styles.statIcon} style={{ backgroundColor: "#18241C" }}><CheckmarkCircle20Regular style={{ color: "#7ECC9A" }} /></div><div><Text size={600} weight="bold">{approved.length}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Approved</Text></div></div></Card>
            <Card><div className={styles.statCell}><div className={styles.statIcon} style={{ backgroundColor: "#2D1B69" }}><Crown20Regular style={{ color: "#7C3AED" }} /></div><div><Text size={600} weight="bold">{users.filter((u) => u.role === "ADMIN").length}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Admins</Text></div></div></Card>
          </div>

          {/* Feature Flags */}
          <Card>
            <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Settings20Regular style={{ color: tokens.colorNeutralForeground3 }} /> Page Visibility</span></CardTitle></CardHeader>
            <CardContent>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: 12 }} block>Toggle pages on or off for all users.</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { flag: "showNodes", label: "Nodes", desc: "Infrastructure node management page" },
                  { flag: "showConfigurations", label: "Configurations", desc: "DSC configuration documents page" },
                  { flag: "showImport", label: "Import", desc: "DSC document import page" },
                ].map((item) => (
                  <div key={item.flag} className={styles.flagRow}>
                    <div>
                      <Text size={300} weight="medium" block>{item.label}</Text>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{item.desc}</Text>
                    </div>
                    <Switch checked={flags[item.flag]} onChange={() => handleToggleFlag(item.flag)} disabled={togglingFlag === item.flag} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {pending.length > 0 && (
            <Card>
              <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock20Regular style={{ color: "#E8D07A" }} /> Pending Approvals ({pending.length})</span></CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pending.map((u) => (
                    <div key={u.id} className={styles.pendingCard}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className={styles.pendingAvatar}>{u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}</div>
                        <div>
                          <Text weight="semibold" block>{u.name || "No name"}</Text>
                          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>{u.email}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Registered {timeAgo(u.createdAt)}</Text>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button appearance="primary" size="small" style={{ backgroundColor: "#2F855A" }} icon={<PersonAvailable20Regular />} onClick={() => handleAction(u.id, "approve", "approve")}>Approve</Button>
                        <Button appearance="primary" size="small" style={{ backgroundColor: "#C53030" }} icon={<PersonDelete20Regular />} onClick={() => handleAction(u.id, "reject", "reject")}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Users */}
          <Card>
            <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><People20Regular style={{ color: "#B89ADA" }} /> All Users</span></CardTitle></CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState icon={People20Regular} title="No users" description="No registered users yet." />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.table}>
                    <thead><tr>
                      <th className={styles.th}>User</th>
                      <th className={styles.th}>Role</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Last Login</th>
                      <th className={styles.th}>Sessions</th>
                      <th className={styles.th}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className={styles.trHover}>
                          <td className={styles.td}><Text weight="medium" block>{u.name || "—"}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{u.email}</Text></td>
                          <td className={styles.td}><Badge variant={u.role === "ADMIN" ? "active" : u.role === "USER" ? "compliant" : "drifted"}>{u.role}</Badge></td>
                          <td className={styles.td}>{u.isApproved ? <Badge variant="compliant">Approved</Badge> : <Badge variant="drifted">Pending</Badge>}</td>
                          <td className={styles.td}><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{timeAgo(u.lastLoginAt)}</Text></td>
                          <td className={styles.td}>{u._count.sessions}</td>
                          <td className={styles.td}>
                            <div className={styles.buttonGroup}>
                              {u.role !== "ADMIN" && u.isApproved && (
                                <Button appearance="subtle" size="small" icon={<Crown20Regular />} onClick={() => handleAction(u.id, "promote", "promote")} />
                              )}
                              {u.isApproved && u.role !== "ADMIN" && (
                                <Button appearance="subtle" size="small" icon={<ProhibitedMultiple20Regular style={{ color: "#F28B8B" }} />} onClick={() => handleAction(u.id, "revoke", "revoke")} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "audit" && (
        <>
          <Card>
            <CardContent>
              <div className={styles.filterRow}>
                <Filter20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>Filters</Text>
                <Select value={auditFilter} onChange={(e) => { setAuditFilter((e.target as HTMLSelectElement).value); setAuditPage(1); }} appearance="filled-darker">
                  <option value="">All Actions</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="REGISTER">Register</option>
                  <option value="PASSWORD_CHANGED">Password Changed</option>
                  <option value="ACCOUNT_LOCKED">Account Locked</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="TENANT_CONNECTED">Tenant Connected</option>
                  <option value="SYNC_TRIGGERED">Sync Triggered</option>
                </Select>
                <Input
                  placeholder="Filter by email..."
                  value={auditEmailFilter}
                  onChange={(e) => { setAuditEmailFilter((e.target as HTMLInputElement).value); setAuditPage(1); }}
                  appearance="filled-darker"
                  style={{ width: 224 }}
                />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginLeft: "auto" }}>{auditTotal} entries</Text>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {auditLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner /></div>
              ) : auditLogs.length === 0 ? (
                <EmptyState icon={DocumentBulletList20Regular} title="No audit entries" description="No audit log entries found." />
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className={styles.table}>
                      <thead><tr>
                        <th className={styles.th}>Time</th>
                        <th className={styles.th}>Action</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>IP Address</th>
                        <th className={styles.th}>Details</th>
                      </tr></thead>
                      <tbody>
                        {auditLogs.map((log) => {
                          const meta = actionLabels[log.action] || { label: log.action, variant: "default" as const };
                          return (
                            <tr key={log.id} className={styles.trHover} style={!log.success ? { backgroundColor: "#F28B8B08" } : undefined}>
                              <td className={styles.td} style={{ whiteSpace: "nowrap" }}><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{new Date(log.createdAt).toLocaleString()}</Text></td>
                              <td className={styles.td}><Badge variant={meta.variant}>{meta.label}</Badge></td>
                              <td className={styles.td}><Text size={200} style={{ fontFamily: "monospace" }}>{log.email || "—"}</Text></td>
                              <td className={styles.td}><Text size={200} style={{ fontFamily: "monospace", color: tokens.colorNeutralForeground3 }}>{log.ipAddress || "—"}</Text></td>
                              <td className={styles.td} style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.details || ""}><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{log.details || "—"}</Text></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {auditPages > 1 && (
                    <div className={styles.pagination}>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Page {auditPage} of {auditPages}</Text>
                      <div className={styles.buttonGroup}>
                        <Button appearance="subtle" size="small" icon={<ChevronLeft20Regular />} disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)}>Prev</Button>
                        <Button appearance="subtle" size="small" disabled={auditPage >= auditPages} onClick={() => setAuditPage((p) => p + 1)}>Next<ChevronRight20Regular /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
