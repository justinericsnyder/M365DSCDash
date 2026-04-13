"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { Shield, UserCheck, UserX, Users, Clock, CheckCircle2, XCircle, Crown, Ban, Settings, ScrollText, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import toast from "react-hot-toast";
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

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({ showNodes: true, showConfigurations: true, showImport: true });
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditEmailFilter, setAuditEmailFilter] = useState("");

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

  // Fetch feature flags
  useEffect(() => {
    fetch("/api/admin/flags").then((r) => r.json()).then((data) => {
      if (data.flags) setFlags(data.flags);
    }).catch(() => {});
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: "30" });
      if (auditFilter) params.set("action", auditFilter);
      if (auditEmailFilter) params.set("email", auditEmailFilter);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (data.logs) {
        setAuditLogs(data.logs);
        setAuditPages(data.pages);
        setAuditTotal(data.total);
      }
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  }, [auditPage, auditFilter, auditEmailFilter]);

  useEffect(() => {
    if (tab === "audit") fetchAuditLogs();
  }, [tab, fetchAuditLogs]);

  const handleToggleFlag = async (flag: string) => {
    setTogglingFlag(flag);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled: !flags[flag] }),
      });
      const data = await res.json();
      if (data.success) {
        setFlags(data.flags);
        toast.success(`${flag} ${data.flags[flag] ? "enabled" : "disabled"}`);
      } else toast.error(data.error);
    } catch { toast.error("Failed to toggle"); }
    finally { setTogglingFlag(null); }
  };

  const handleAction = async (userId: string, action: string, label: string) => {
    if (action === "reject" && !confirm(`Are you sure you want to reject and remove this user?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchUsers(); }
      else toast.error(data.error);
    } catch { toast.error(`Failed to ${label}`); }
  };

  const pending = users.filter((u) => u.role === "PENDING" && !u.isApproved);
  const approved = users.filter((u) => u.isApproved);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>;
  if (error) return <div className="text-center py-16 text-dsc-red">{error}</div>;

  return (
    <div className="space-y-6 stagger-children max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-dsc-text">Admin Panel</h2>
          <Badge variant="active"><Shield className="h-3 w-3 mr-0.5" />Admin</Badge>
        </div>
        <p className="text-sm text-dsc-text-secondary mt-1">Manage user accounts, access approvals, and security audit trail</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dsc-border">
        {[
          { key: "users" as const, label: "Users & Settings", icon: Users },
          { key: "audit" as const, label: `Audit Log${auditTotal ? ` (${auditTotal})` : ""}`, icon: ScrollText },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-dsc-blue text-dsc-text" : "border-transparent text-dsc-text-secondary hover:text-dsc-text"}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2"><Users className="h-4 w-4 text-dsc-blue" /></div><div><p className="text-xl font-bold">{users.length}</p><p className="text-xs text-dsc-text-secondary">Total Users</p></div></div></Card>
            <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-yellow-50 p-2"><Clock className="h-4 w-4 text-dsc-yellow" /></div><div><p className="text-xl font-bold text-dsc-yellow">{pending.length}</p><p className="text-xs text-dsc-text-secondary">Pending</p></div></div></Card>
            <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2"><CheckCircle2 className="h-4 w-4 text-dsc-green" /></div><div><p className="text-xl font-bold">{approved.length}</p><p className="text-xs text-dsc-text-secondary">Approved</p></div></div></Card>
            <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2"><Crown className="h-4 w-4 text-purple-600" /></div><div><p className="text-xl font-bold">{users.filter((u) => u.role === "ADMIN").length}</p><p className="text-xs text-dsc-text-secondary">Admins</p></div></div></Card>
          </div>

          {/* Feature Flags */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-dsc-text-secondary" />Page Visibility</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-dsc-text-secondary mb-3">Toggle pages on or off for all users. Disabled pages are hidden from the navigation.</p>
              <div className="space-y-2">
                {[
                  { flag: "showNodes", label: "Nodes", desc: "Infrastructure node management page" },
                  { flag: "showConfigurations", label: "Configurations", desc: "DSC configuration documents page" },
                  { flag: "showImport", label: "Import", desc: "DSC document import page" },
                ].map((item) => (
                  <div key={item.flag} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                    <div>
                      <p className="text-sm font-medium text-dsc-text">{item.label}</p>
                      <p className="text-[10px] text-dsc-text-secondary">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFlag(item.flag)}
                      disabled={togglingFlag === item.flag}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${flags[item.flag] ? "bg-dsc-green" : "bg-dsc-border"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${flags[item.flag] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {pending.length > 0 && (
            <Card className="border-dsc-yellow/30">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-dsc-yellow" />Pending Approvals ({pending.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pending.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-dsc-yellow-50/50 border border-dsc-yellow/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-dsc-yellow/20 flex items-center justify-center text-dsc-yellow font-bold">
                          {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-dsc-text">{u.name || "No name"}</p>
                          <p className="text-sm text-dsc-text-secondary">{u.email}</p>
                          <p className="text-xs text-dsc-text-secondary">Registered {timeAgo(u.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" onClick={() => handleAction(u.id, "approve", "approve")}>
                          <UserCheck className="h-3.5 w-3.5" />Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleAction(u.id, "reject", "reject")}>
                          <UserX className="h-3.5 w-3.5" />Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Users */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-dsc-blue" />All Users</CardTitle></CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState icon={Users} title="No users" description="No registered users yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-dsc-border bg-dsc-bg">
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">User</th>
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Role</th>
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Status</th>
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Last Login</th>
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Sessions</th>
                      <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-dsc-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-dsc-bg">
                          <td className="py-2.5 px-3">
                            <p className="font-medium">{u.name || "—"}</p>
                            <p className="text-xs text-dsc-text-secondary">{u.email}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={u.role === "ADMIN" ? "active" : u.role === "USER" ? "compliant" : "drifted"}>
                              {u.role === "ADMIN" && <Shield className="h-3 w-3 mr-0.5" />}{u.role}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {u.isApproved ? <Badge variant="compliant">Approved</Badge> : <Badge variant="drifted">Pending</Badge>}
                          </td>
                          <td className="py-2.5 px-3 text-dsc-text-secondary">{timeAgo(u.lastLoginAt)}</td>
                          <td className="py-2.5 px-3">{u._count.sessions}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1">
                              {u.role !== "ADMIN" && u.isApproved && (
                                <Button variant="ghost" size="sm" onClick={() => handleAction(u.id, "promote", "promote")}>
                                  <Crown className="h-3 w-3" />
                                </Button>
                              )}
                              {u.isApproved && u.role !== "ADMIN" && (
                                <Button variant="ghost" size="sm" onClick={() => handleAction(u.id, "revoke", "revoke")}>
                                  <Ban className="h-3 w-3 text-dsc-red" />
                                </Button>
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
          {/* Filters */}
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-dsc-text-secondary">
                  <Filter className="h-3.5 w-3.5" />Filters
                </div>
                <select
                  value={auditFilter}
                  onChange={(e) => { setAuditFilter(e.target.value); setAuditPage(1); }}
                  className="text-sm rounded-lg border border-dsc-border bg-dsc-bg text-dsc-text px-3 py-1.5"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="REGISTER">Register</option>
                  <option value="PASSWORD_CHANGED">Password Changed</option>
                  <option value="PASSWORD_CHANGE_FAILED">Password Change Failed</option>
                  <option value="ACCOUNT_LOCKED">Account Locked</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="TENANT_CONNECTED">Tenant Connected</option>
                  <option value="SYNC_TRIGGERED">Sync Triggered</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={auditEmailFilter}
                  onChange={(e) => { setAuditEmailFilter(e.target.value); setAuditPage(1); }}
                  className="text-sm rounded-lg border border-dsc-border bg-dsc-bg text-dsc-text px-3 py-1.5 w-56 placeholder:text-dsc-text-secondary"
                />
                <span className="text-xs text-dsc-text-secondary ml-auto">{auditTotal} entries</span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardContent>
              {auditLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dsc-blue" /></div>
              ) : auditLogs.length === 0 ? (
                <EmptyState icon={ScrollText} title="No audit entries" description="No audit log entries found. Events will appear here as users interact with the system." />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-dsc-border bg-dsc-bg">
                        <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Time</th>
                        <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Action</th>
                        <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Email</th>
                        <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">IP Address</th>
                        <th className="text-left py-2.5 px-3 font-medium text-dsc-text-secondary">Details</th>
                      </tr></thead>
                      <tbody className="divide-y divide-dsc-border">
                        {auditLogs.map((log) => {
                          const meta = actionLabels[log.action] || { label: log.action, variant: "default" as const };
                          return (
                            <tr key={log.id} className={`hover:bg-dsc-bg ${!log.success ? "bg-dsc-red/5" : ""}`}>
                              <td className="py-2.5 px-3 text-xs text-dsc-text-secondary whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant={meta.variant}>{meta.label}</Badge>
                              </td>
                              <td className="py-2.5 px-3 text-dsc-text font-mono text-xs">{log.email || "—"}</td>
                              <td className="py-2.5 px-3 text-dsc-text-secondary font-mono text-xs">{log.ipAddress || "—"}</td>
                              <td className="py-2.5 px-3 text-xs text-dsc-text-secondary max-w-[200px] truncate" title={log.details || ""}>
                                {log.details || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {auditPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dsc-border">
                      <span className="text-xs text-dsc-text-secondary">Page {auditPage} of {auditPages}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)}>
                          <ChevronLeft className="h-3.5 w-3.5" />Prev
                        </Button>
                        <Button variant="ghost" size="sm" disabled={auditPage >= auditPages} onClick={() => setAuditPage((p) => p + 1)}>
                          Next<ChevronRight className="h-3.5 w-3.5" />
                        </Button>
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

