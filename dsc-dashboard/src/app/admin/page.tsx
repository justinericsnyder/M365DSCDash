"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { Shield, UserCheck, UserX, Users, Clock, CheckCircle2, XCircle, Crown, Ban } from "lucide-react";
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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-dsc-text">Admin Panel</h2>
          <Badge variant="active"><Shield className="h-3 w-3 mr-0.5" />Admin</Badge>
        </div>
        <p className="text-sm text-dsc-text-secondary mt-1">Manage user accounts and access approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-blue-50 p-2"><Users className="h-4 w-4 text-dsc-blue" /></div><div><p className="text-xl font-bold">{users.length}</p><p className="text-xs text-dsc-text-secondary">Total Users</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-yellow-50 p-2"><Clock className="h-4 w-4 text-dsc-yellow" /></div><div><p className="text-xl font-bold text-dsc-yellow">{pending.length}</p><p className="text-xs text-dsc-text-secondary">Pending</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-dsc-green-50 p-2"><CheckCircle2 className="h-4 w-4 text-dsc-green" /></div><div><p className="text-xl font-bold">{approved.length}</p><p className="text-xs text-dsc-text-secondary">Approved</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-50 p-2"><Crown className="h-4 w-4 text-purple-600" /></div><div><p className="text-xl font-bold">{users.filter((u) => u.role === "ADMIN").length}</p><p className="text-xs text-dsc-text-secondary">Admins</p></div></div></Card>
      </div>

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
    </div>
  );
}

