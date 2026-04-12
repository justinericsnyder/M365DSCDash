"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Database, RefreshCw, Trash2, ExternalLink, Server, Globe,
  Cloud, ShieldCheck, Bot, Link2, Unlink, CheckCircle2, AlertTriangle,
  ArrowRight, Lock, Key, Fingerprint,
} from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MsStatus {
  connected: boolean;
  authenticated: boolean;
  hasTenant?: boolean;
  tenant?: {
    id: string;
    displayName: string;
    tenantName: string;
    defaultDomain: string;
    connectedUserEmail: string | null;
    scopes: string[];
    lastSyncAt: string | null;
    error: string | null;
  };
}

interface AuthUser {
  id: string; name: string; email: string; role: string; isApproved: boolean;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dsc-blue" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [msStatus, setMsStatus] = useState<MsStatus | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; count?: number; error?: string; skipped?: boolean; reason?: string }> | null>(null);
  const [endpointStatus, setEndpointStatus] = useState<Array<{ name: string; status: string; count?: number; error?: string }> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = useCallback(async () => {
    const [authRes, msRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ authenticated: false })),
      fetch("/api/microsoft/status").then((r) => r.json()).catch(() => ({ connected: false })),
    ]);
    if (authRes.authenticated) setUser(authRes.user);
    setMsStatus(msRes);

    // If connected, also fetch endpoint status
    if (msRes.connected) {
      fetchEndpointStatus();
    }
  }, []);

  const fetchEndpointStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/microsoft/sync/debug");
      if (res.ok) {
        const data = await res.json();
        setEndpointStatus(data.results || []);
      }
    } catch { /* ignore */ }
    finally { setLoadingStatus(false); }
  };

  useEffect(() => {
    fetchStatus();
    // Handle OAuth callback messages
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "true") {
      toast.success("Microsoft 365 connected successfully!");
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, "", "/settings");
    }
  }, [fetchStatus, searchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/microsoft/connect");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to start connection");
        setConnecting(false);
      }
    } catch {
      toast.error("Failed to start connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Microsoft 365? This will remove the stored authorization. You can reconnect at any time.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/microsoft/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Microsoft 365 disconnected");
        fetchStatus();
      } else toast.error(data.error);
    } catch { toast.error("Failed to disconnect"); }
    finally { setDisconnecting(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await fetch("/api/microsoft/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSyncResults(data.results);
        fetchStatus();
        fetchEndpointStatus();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch { toast.error("Sync failed"); }
    finally { setSyncing(false); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const results = await Promise.all([
        fetch("/api/seed", { method: "POST" }).then((r) => r.json()),
        fetch("/api/m365/seed", { method: "POST" }).then((r) => r.json()),
        fetch("/api/agents/seed", { method: "POST" }).then((r) => r.json()),
        fetch("/api/purview/seed", { method: "POST" }).then((r) => r.json()),
      ]);
      const allOk = results.every((r) => r.success);
      if (allOk) toast.success("All demo data loaded");
      else toast.error("Some seeds failed");
    } catch { toast.error("Seed failed"); }
    finally { setSeeding(false); }
  };

  const isAuthenticated = !!user;
  const isConnected = msStatus?.connected;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-gravity-in">
        <Lock className="h-12 w-12 text-dsc-text-secondary mb-4" />
        <h2 className="text-2xl font-bold text-dsc-text mb-2">Sign in required</h2>
        <p className="text-dsc-text-secondary max-w-md mb-6">You need to sign in to access Settings and manage your Microsoft 365 connection.</p>
        <div className="flex gap-3">
          <a href="/login"><Button>Sign In</Button></a>
          <a href="/register"><Button variant="outline">Create Account</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Settings</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">Connect your Microsoft 365 tenant and manage data</p>
      </div>

      {/* ─── Microsoft 365 Connection ──────────────────── */}
      <Card className={isConnected ? "border-dsc-green/30" : isAuthenticated ? "border-dsc-blue/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-4 w-4 text-dsc-blue" />
            Microsoft 365 Connection
          </CardTitle>
          <CardDescription>
            {isConnected
              ? "Your tenant is connected. Data is pulled via Microsoft Graph API."
              : "Connect your Microsoft 365 tenant to pull real data for Purview labels, Agent Registry, and M365 DSC."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            /* Not logged in */
            <div className="p-4 rounded-lg bg-dsc-bg border border-dsc-border text-center">
              <Lock className="h-8 w-8 text-dsc-text-secondary mx-auto mb-3" />
              <p className="text-sm font-medium text-dsc-text mb-1">Sign in to connect your tenant</p>
              <p className="text-xs text-dsc-text-secondary mb-4">You need an account to set up Microsoft 365 integration.</p>
              <a href="/login"><Button size="sm">Sign In</Button></a>
            </div>
          ) : isConnected && msStatus?.tenant ? (
            /* Connected */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-dsc-green-50 border border-dsc-green/20">
                <CheckCircle2 className="h-5 w-5 text-dsc-green flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-dsc-text">Connected to {msStatus.tenant.displayName}</p>
                  <p className="text-xs text-dsc-text-secondary">{msStatus.tenant.tenantName} · {msStatus.tenant.defaultDomain}</p>
                </div>
                <Badge variant="compliant">Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <p className="text-xs text-dsc-text-secondary">Authorized By</p>
                  <p className="font-medium">{msStatus.tenant.connectedUserEmail || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <p className="text-xs text-dsc-text-secondary">Last Sync</p>
                  <p className="font-medium">{timeAgo(msStatus.tenant.lastSyncAt)}</p>
                </div>
              </div>

              {msStatus.tenant.scopes.length > 0 && (
                <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                  <p className="text-xs text-dsc-text-secondary mb-2">Granted Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msStatus.tenant.scopes.map((s) => (
                      <span key={s} className="text-[10px] bg-dsc-blue-50 text-dsc-blue px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {msStatus.tenant.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-sm text-dsc-red">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />{msStatus.tenant.error}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting}>
                  <RefreshCw className={`h-3.5 w-3.5 ${connecting ? "animate-spin" : ""}`} />Reconnect
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={disconnecting} className="text-dsc-red hover:text-dsc-red">
                  <Unlink className="h-3.5 w-3.5" />Disconnect
                </Button>
              </div>

              {/* ─── Sync Results ──────────────────────── */}
              {syncResults && (
                <div className="p-4 rounded-lg bg-dsc-bg border border-dsc-border">
                  <h4 className="text-sm font-semibold text-dsc-text mb-3">Last Sync Results</h4>
                  <div className="space-y-2">
                    {Object.entries(syncResults).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-md bg-dsc-surface border border-dsc-border/50">
                        <div className="flex items-center gap-2">
                          {val.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-dsc-green flex-shrink-0" />
                          ) : val.skipped ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-dsc-yellow flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-dsc-red flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-dsc-text">{key}</span>
                        </div>
                        <div className="text-right">
                          {val.success && val.count !== undefined ? (
                            <span className="text-xs text-dsc-green font-medium">{val.count} items</span>
                          ) : val.success ? (
                            <span className="text-xs text-dsc-green font-medium">Synced</span>
                          ) : val.skipped ? (
                            <span className="text-xs text-dsc-yellow">{val.reason?.substring(0, 60)}...</span>
                          ) : (
                            <span className="text-xs text-dsc-red">{val.error?.substring(0, 60)}...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Endpoint Status ───────────────────── */}
              {endpointStatus && (
                <div className="p-4 rounded-lg bg-dsc-bg border border-dsc-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-dsc-text">API Endpoint Status</h4>
                    <div className="flex items-center gap-3 text-xs text-dsc-text-secondary">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-dsc-green" />{endpointStatus.filter((e) => e.status.includes("OK")).length} working</span>
                      <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-dsc-red" />{endpointStatus.filter((e) => !e.status.includes("OK")).length} failed</span>
                      <button onClick={fetchEndpointStatus} className="text-dsc-blue hover:underline" disabled={loadingStatus}>
                        {loadingStatus ? "Checking..." : "Refresh"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {endpointStatus.map((ep, i) => {
                      const isOk = ep.status.includes("OK");
                      const hasData = ep.count !== undefined && ep.count > 0;
                      return (
                        <div key={i} className={`flex items-center justify-between p-2 rounded-md text-xs ${isOk ? "bg-dsc-surface" : "bg-dsc-red-50/50"} border border-dsc-border/50`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isOk ? (
                              hasData ? <CheckCircle2 className="h-3 w-3 text-dsc-green flex-shrink-0" /> : <div className="h-3 w-3 rounded-full bg-dsc-border/50 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-dsc-red flex-shrink-0" />
                            )}
                            <span className={`truncate ${isOk ? "text-dsc-text" : "text-dsc-red"}`}>{ep.name}</span>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {isOk ? (
                              ep.count !== undefined ? (
                                <span className={`font-medium ${hasData ? "text-dsc-green" : "text-dsc-text-secondary"}`}>{ep.count}</span>
                              ) : (
                                <span className="text-dsc-green">✓</span>
                              )
                            ) : (
                              <span className="text-dsc-red">{ep.status.split(" ")[0]}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Authenticated but not connected — onboarding */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-dsc-blue-50/50 border border-dsc-blue/20">
                <h4 className="text-sm font-semibold text-dsc-text mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-dsc-blue" />How it works
                </h4>
                <div className="space-y-3 text-sm text-dsc-text-secondary">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-dsc-blue text-white text-xs flex items-center justify-center font-bold">1</span>
                    <div>
                      <p className="font-medium text-dsc-text">Click &ldquo;Connect Microsoft 365&rdquo;</p>
                      <p className="text-xs">You&apos;ll be redirected to Microsoft&apos;s sign-in page.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-dsc-blue text-white text-xs flex items-center justify-center font-bold">2</span>
                    <div>
                      <p className="font-medium text-dsc-text">Sign in and consent</p>
                      <p className="text-xs">Use your Microsoft 365 admin account. Review and accept the requested permissions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-dsc-blue text-white text-xs flex items-center justify-center font-bold">3</span>
                    <div>
                      <p className="font-medium text-dsc-text">Data flows automatically</p>
                      <p className="text-xs">Purview labels, Agent Registry, and tenant config data will be pulled via Microsoft Graph API.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border/50">
                <p className="text-xs text-dsc-text-secondary flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  <strong>Security:</strong> We use OAuth2 with PKCE. No passwords or client secrets from your tenant are stored. You can revoke access anytime from your Azure AD portal.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-dsc-bg border border-dsc-border/50">
                <p className="text-xs text-dsc-text-secondary mb-2">Permissions requested:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["User.Read", "Organization.Read.All", "Directory.Read.All", "Policy.Read.All", "SensitivityLabel.Read", "SecurityEvents.Read.All", "DeviceManagementConfiguration.Read.All", "MailboxSettings.Read", "RoleManagement.Read.Directory"].map((p) => (
                    <span key={p} className="text-[10px] bg-dsc-blue-50 text-dsc-blue px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" />{p}
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={handleConnect} disabled={connecting} size="lg" className="w-full">
                <Cloud className="h-4 w-4" />
                {connecting ? "Redirecting to Microsoft..." : "Connect Microsoft 365"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── What Gets Synced ──────────────────────────── */}
      {isAuthenticated && !isConnected && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <ShieldCheck className="h-8 w-8 text-dsc-yellow mx-auto mb-2" />
            <p className="text-sm font-semibold">Purview Labels</p>
            <p className="text-[10px] text-dsc-text-secondary mt-1">Sensitivity labels, protection scopes, drift monitoring</p>
          </Card>
          <Card className="text-center p-4">
            <Bot className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">Agent Registry</p>
            <p className="text-[10px] text-dsc-text-secondary mt-1">Copilot agents, deployment status, governance</p>
          </Card>
          <Card className="text-center p-4">
            <Cloud className="h-8 w-8 text-dsc-blue mx-auto mb-2" />
            <p className="text-sm font-semibold">M365 DSC</p>
            <p className="text-[10px] text-dsc-text-secondary mt-1">Tenant configuration compliance across workloads</p>
          </Card>
        </div>
      )}

      {/* ─── Change Password ───────────────────────────── */}
      <ChangePasswordSection />

      {/* ─── Infrastructure ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-dsc-blue" />Infrastructure</CardTitle>
          <CardDescription>Hosting and service configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Vercel", desc: "Next.js Application Hosting", color: "bg-black", icon: "▲" },
              { name: "Railway", desc: "Redis Cache + PostgreSQL", color: "bg-purple-600", icon: null },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-dsc-bg border border-dsc-border">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md ${svc.color} p-1.5`}>
                    {svc.icon ? <span className="text-white text-xs font-bold">{svc.icon}</span> : <Server className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{svc.name}</p>
                    <p className="text-xs text-dsc-text-secondary">{svc.desc}</p>
                  </div>
                </div>
                <Badge variant="compliant">Connected</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Demo Data ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-dsc-green" />Demo Data</CardTitle>
          <CardDescription>Load sample data for testing and demonstration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-dsc-blue-50 border border-dsc-blue/20">
            <div>
              <p className="text-sm font-medium">Load All Demo Data</p>
              <p className="text-xs text-dsc-text-secondary mt-0.5">Nodes, configs, M365 resources, agents, Purview labels, and drift events</p>
            </div>
            <Button onClick={handleSeed} disabled={seeding}>
              <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />{seeding ? "Loading..." : "Seed Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── About ─────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-dsc-text-secondary" />About</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-dsc-text-secondary mb-4">
            DSC Dashboard integrates PowerShell DSC v3, Microsoft365DSC, Microsoft Purview, and Agent 365 Registry into a unified compliance management interface.
          </p>
          <div className="flex gap-3">
            <a href="https://learn.microsoft.com/en-us/powershell/dsc/overview?view=dsc-3.0" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5" />DSC Docs</Button>
            </a>
            <a href="https://learn.microsoft.com/en-us/graph/api/tenantdatasecurityandgovernance-list-sensitivitylabels" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5" />Purview API</Button>
            </a>
            <a href="https://github.com/PowerShell/DSC" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5" />GitHub</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setCurrentPassword(""); setNewPassword(""); setConfirm("");
      } else setError(data.error);
    } catch { setError("Failed to change password"); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-dsc-text-secondary" />Change Password</CardTitle>
        <CardDescription>Update your password. All other sessions will be signed out.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <Input id="currentPw" label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input id="newPw" label="New Password" type="password" placeholder="Min 10 chars, upper+lower+number+special" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input id="confirmPw" label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-xs text-dsc-red"><AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{error}</div>}
          {success && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-dsc-green-50 border border-dsc-green/20 text-xs text-dsc-green"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />{success}</div>}
          <Button type="submit" size="sm" disabled={loading}><Lock className="h-3.5 w-3.5" />{loading ? "Updating..." : "Update Password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
