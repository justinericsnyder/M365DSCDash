"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Field,
  Spinner,
  MessageBar,
  MessageBarBody,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  Toaster,
} from "@fluentui/react-components";
import {
  Settings20Regular,
  Database20Regular,
  ArrowSync20Regular,
  Delete20Regular,
  Open20Regular,
  Server20Regular,
  Globe20Regular,
  Cloud20Regular,
  ShieldCheckmark20Regular,
  Bot20Regular,
  Link20Regular,
  LinkDismiss20Regular,
  CheckmarkCircle20Regular,
  Warning20Regular,
  ArrowRight20Regular,
  LockClosed20Regular,
  Key20Regular,
  Fingerprint20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "768px" },
  connectedBanner: {
    display: "flex", alignItems: "center", gap: "12px", padding: "16px",
    borderRadius: tokens.borderRadiusMedium, backgroundColor: "#18241C", border: "1px solid #7ECC9A30",
  },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  infoBox: {
    padding: "12px", borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  scopeList: { display: "flex", flexWrap: "wrap", gap: "6px" },
  scopeChip: {
    fontSize: "10px", backgroundColor: "#221830", color: "#B89ADA",
    padding: "2px 8px", borderRadius: "9999px",
  },
  buttonRow: { display: "flex", gap: "8px" },
  resultRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px",
    borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stepRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  stepNum: {
    flexShrink: 0, height: "24px", width: "24px", borderRadius: "9999px",
    backgroundColor: tokens.colorBrandBackground, color: "white", fontSize: "12px",
    fontWeight: tokens.fontWeightBold, display: "flex", alignItems: "center", justifyContent: "center",
  },
  permList: { display: "flex", flexWrap: "wrap", gap: "6px" },
  permChip: {
    fontSize: "10px", backgroundColor: "#221830", color: "#B89ADA",
    padding: "2px 8px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "4px",
  },
  whatSyncGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  whatSyncCard: { textAlign: "center", padding: "16px" },
  svcRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px",
    borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  svcLeft: { display: "flex", alignItems: "center", gap: "12px" },
  svcIcon: { borderRadius: tokens.borderRadiusMedium, padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" },
  endpointGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" },
  endpointCell: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px",
    borderRadius: tokens.borderRadiusMedium, fontSize: tokens.fontSizeBase200,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  authForm: { display: "flex", flexDirection: "column", gap: "12px", maxWidth: "384px" },
  centerPage: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "60vh", textAlign: "center",
  },
});

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size="large" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const styles = useStyles();
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
  const toasterId = useId("settings-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const fetchStatus = useCallback(async () => {
    const [authRes, msRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ authenticated: false })),
      fetch("/api/microsoft/status").then((r) => r.json()).catch(() => ({ connected: false })),
    ]);
    if (authRes.authenticated) setUser(authRes.user);
    setMsStatus(msRes);
    if (msRes.connected) fetchEndpointStatus();
  }, []);

  const fetchEndpointStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/microsoft/sync/debug");
      if (res.ok) { const data = await res.json(); setEndpointStatus(data.results || []); }
    } catch { /* ignore */ }
    finally { setLoadingStatus(false); }
  };

  useEffect(() => {
    fetchStatus();
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "true") {
      dispatchToast(<Toast><ToastTitle>Microsoft 365 connected successfully!</ToastTitle></Toast>, { intent: "success" });
      window.history.replaceState({}, "", "/settings");
    }
    if (error) {
      dispatchToast(<Toast><ToastTitle>{decodeURIComponent(error)}</ToastTitle></Toast>, { intent: "error" });
      window.history.replaceState({}, "", "/settings");
    }
  }, [fetchStatus, searchParams, dispatchToast]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/microsoft/connect");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { dispatchToast(<Toast><ToastTitle>{data.error || "Failed to start connection"}</ToastTitle></Toast>, { intent: "error" }); setConnecting(false); }
    } catch { dispatchToast(<Toast><ToastTitle>Failed to start connection</ToastTitle></Toast>, { intent: "error" }); setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Microsoft 365? This will remove the stored authorization.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/microsoft/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) { dispatchToast(<Toast><ToastTitle>Microsoft 365 disconnected</ToastTitle></Toast>, { intent: "success" }); fetchStatus(); }
      else dispatchToast(<Toast><ToastTitle>{data.error}</ToastTitle></Toast>, { intent: "error" });
    } catch { dispatchToast(<Toast><ToastTitle>Failed to disconnect</ToastTitle></Toast>, { intent: "error" }); }
    finally { setDisconnecting(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResults(null);
    try {
      const res = await fetch("/api/microsoft/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) { dispatchToast(<Toast><ToastTitle>{data.message}</ToastTitle></Toast>, { intent: "success" }); setSyncResults(data.results); fetchStatus(); fetchEndpointStatus(); }
      else dispatchToast(<Toast><ToastTitle>{data.error || "Sync failed"}</ToastTitle></Toast>, { intent: "error" });
    } catch { dispatchToast(<Toast><ToastTitle>Sync failed</ToastTitle></Toast>, { intent: "error" }); }
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
      dispatchToast(<Toast><ToastTitle>{allOk ? "All demo data loaded" : "Some seeds failed"}</ToastTitle></Toast>, { intent: allOk ? "success" : "error" });
    } catch { dispatchToast(<Toast><ToastTitle>Seed failed</ToastTitle></Toast>, { intent: "error" }); }
    finally { setSeeding(false); }
  };

  const isAuthenticated = !!user;
  const isConnected = msStatus?.connected;

  if (!isAuthenticated) {
    return (
      <div className={styles.centerPage}>
        <Toaster toasterId={toasterId} />
        <LockClosed20Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3, marginBottom: 16 }} />
        <Text size={700} weight="bold" block style={{ marginBottom: 8 }}>Sign in required</Text>
        <Text size={400} style={{ color: tokens.colorNeutralForeground3, maxWidth: 400, marginBottom: 24 }} block>You need to sign in to access Settings.</Text>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/login"><Button appearance="primary">Sign In</Button></a>
          <a href="/register"><Button appearance="outline">Create Account</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toaster toasterId={toasterId} />
      <div>
        <Text size={700} weight="bold" block>Settings</Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>Connect your Microsoft 365 tenant and manage data</Text>
      </div>

      {/* Microsoft 365 Connection */}
      <Card>
        <CardHeader>
          <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Cloud20Regular style={{ color: "#B89ADA" }} /> Microsoft 365 Connection</span></CardTitle>
          <CardDescription>{isConnected ? "Your tenant is connected. Data is pulled via Microsoft Graph API." : "Connect your Microsoft 365 tenant to pull real data."}</CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected && msStatus?.tenant ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={styles.connectedBanner}>
                <CheckmarkCircle20Regular style={{ color: "#7ECC9A", fontSize: 20 }} />
                <div style={{ flex: 1 }}>
                  <Text size={300} weight="medium" block>Connected to {msStatus.tenant.displayName}</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{msStatus.tenant.tenantName} · {msStatus.tenant.defaultDomain}</Text>
                </div>
                <Badge variant="compliant">Active</Badge>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoBox}><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Authorized By</Text><Text weight="medium" block>{msStatus.tenant.connectedUserEmail || "—"}</Text></div>
                <div className={styles.infoBox}><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Last Sync</Text><Text weight="medium" block>{timeAgo(msStatus.tenant.lastSyncAt)}</Text></div>
              </div>
              {msStatus.tenant.scopes.length > 0 && (
                <div className={styles.infoBox}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: 8 }} block>Granted Permissions</Text>
                  <div className={styles.scopeList}>{msStatus.tenant.scopes.map((s) => <span key={s} className={styles.scopeChip}>{s}</span>)}</div>
                </div>
              )}
              {msStatus.tenant.error && <MessageBar intent="error"><MessageBarBody>{msStatus.tenant.error}</MessageBarBody></MessageBar>}
              <div className={styles.buttonRow}>
                <Button appearance="primary" icon={<ArrowSync20Regular />} disabled={syncing} onClick={handleSync}>{syncing ? "Syncing..." : "Sync Now"}</Button>
                <Button appearance="outline" size="small" icon={<ArrowSync20Regular />} disabled={connecting} onClick={handleConnect}>Reconnect</Button>
                <Button appearance="subtle" size="small" icon={<LinkDismiss20Regular />} disabled={disconnecting} onClick={handleDisconnect} style={{ color: "#F28B8B" }}>Disconnect</Button>
              </div>
              {syncResults && (
                <div className={styles.infoBox}>
                  <Text size={300} weight="semibold" block style={{ marginBottom: 12 }}>Last Sync Results</Text>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(syncResults).map(([key, val]) => (
                      <div key={key} className={styles.resultRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {val.success ? <CheckmarkCircle20Regular style={{ color: "#7ECC9A" }} /> : val.skipped ? <Warning20Regular style={{ color: "#E8D07A" }} /> : <Warning20Regular style={{ color: "#F28B8B" }} />}
                          <Text size={300} weight="medium">{key}</Text>
                        </div>
                        <div>{val.success && val.count !== undefined ? <Text size={200} style={{ color: "#7ECC9A" }}>{val.count} items</Text> : val.success ? <Text size={200} style={{ color: "#7ECC9A" }}>Synced</Text> : val.skipped ? <Text size={200} style={{ color: "#E8D07A" }}>{val.reason?.substring(0, 60)}</Text> : <Text size={200} style={{ color: "#F28B8B" }}>{val.error?.substring(0, 60)}</Text>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {endpointStatus && (
                <div className={styles.infoBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text size={300} weight="semibold">API Endpoint Status</Text>
                    <Button appearance="transparent" size="small" onClick={fetchEndpointStatus} disabled={loadingStatus}>{loadingStatus ? "Checking..." : "Refresh"}</Button>
                  </div>
                  <div className={styles.endpointGrid}>
                    {endpointStatus.map((ep, i) => {
                      const isOk = ep.status.includes("OK");
                      return (
                        <div key={i} className={styles.endpointCell} style={{ backgroundColor: isOk ? tokens.colorNeutralBackground2 : "#3A0E1450" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            {isOk ? <CheckmarkCircle20Regular style={{ fontSize: 12, color: "#7ECC9A" }} /> : <Warning20Regular style={{ fontSize: 12, color: "#F28B8B" }} />}
                            <Text size={200} truncate style={{ color: isOk ? tokens.colorNeutralForeground1 : "#F28B8B" }}>{ep.name}</Text>
                          </div>
                          <Text size={200} weight="medium" style={{ color: isOk ? "#7ECC9A" : "#F28B8B" }}>{isOk ? (ep.count ?? "✓") : ep.status.split(" ")[0]}</Text>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={styles.infoBox} style={{ backgroundColor: "#22183050", borderColor: "#B89ADA20" }}>
                <Text size={300} weight="semibold" block style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Key20Regular style={{ color: "#B89ADA" }} /> How it works</Text>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { title: "Click \u201CConnect Microsoft 365\u201D", desc: "You\u2019ll be redirected to Microsoft\u2019s sign-in page." },
                    { title: "Sign in and consent", desc: "Use your Microsoft 365 admin account." },
                    { title: "Data flows automatically", desc: "Purview labels, Agent Registry, and tenant config data will be pulled." },
                  ].map((step, i) => (
                    <div key={i} className={styles.stepRow}>
                      <span className={styles.stepNum}>{i + 1}</span>
                      <div><Text size={300} weight="medium" block>{step.title}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{step.desc}</Text></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.infoBox}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: "flex", alignItems: "center", gap: 6 }}><Fingerprint20Regular style={{ fontSize: 14 }} /> <strong>Security:</strong> OAuth2 with PKCE. No passwords stored.</Text>
              </div>
              <div className={styles.infoBox}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: 8 }} block>Permissions requested:</Text>
                <div className={styles.permList}>
                  {["User.Read", "Organization.Read.All", "Directory.Read.All", "Policy.Read.All", "SensitivityLabel.Read", "SecurityEvents.Read.All", "DeviceManagementConfiguration.Read.All", "MailboxSettings.Read", "RoleManagement.Read.Directory"].map((p) => (
                    <span key={p} className={styles.permChip}><LockClosed20Regular style={{ fontSize: 10 }} />{p}</span>
                  ))}
                </div>
              </div>
              <Button appearance="primary" size="large" icon={<Cloud20Regular />} disabled={connecting} onClick={handleConnect} style={{ width: "100%" }}>
                {connecting ? "Redirecting to Microsoft..." : "Connect Microsoft 365"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Gets Synced */}
      {isAuthenticated && !isConnected && (
        <div className={styles.whatSyncGrid}>
          <Card><div className={styles.whatSyncCard}><ShieldCheckmark20Regular style={{ fontSize: 32, color: "#E8D07A", marginBottom: 8 }} /><Text weight="semibold" block size={300}>Purview Labels</Text><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Sensitivity labels, protection scopes</Text></div></Card>
          <Card><div className={styles.whatSyncCard}><Bot20Regular style={{ fontSize: 32, color: "#7C3AED", marginBottom: 8 }} /><Text weight="semibold" block size={300}>Agent Registry</Text><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Copilot agents, deployment status</Text></div></Card>
          <Card><div className={styles.whatSyncCard}><Cloud20Regular style={{ fontSize: 32, color: "#B89ADA", marginBottom: 8 }} /><Text weight="semibold" block size={300}>M365 DSC</Text><Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Tenant configuration compliance</Text></div></Card>
        </div>
      )}

      {/* Change Password */}
      <ChangePasswordSection />

      {/* Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Globe20Regular style={{ color: "#B89ADA" }} /> Infrastructure</span></CardTitle>
          <CardDescription>Hosting and service configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { name: "Vercel", desc: "Next.js Application Hosting", bg: "#000", icon: "▲" },
              { name: "Railway", desc: "Redis Cache + PostgreSQL", bg: "#7C3AED", icon: null },
            ].map((svc) => (
              <div key={svc.name} className={styles.svcRow}>
                <div className={styles.svcLeft}>
                  <div className={styles.svcIcon} style={{ backgroundColor: svc.bg }}>{svc.icon ? <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{svc.icon}</span> : <Server20Regular style={{ color: "white" }} />}</div>
                  <div><Text size={300} weight="medium" block>{svc.name}</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{svc.desc}</Text></div>
                </div>
                <Badge variant="compliant">Connected</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Data */}
      <Card>
        <CardHeader>
          <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Database20Regular style={{ color: "#7ECC9A" }} /> Demo Data</span></CardTitle>
          <CardDescription>Load sample data for testing and demonstration</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: tokens.borderRadiusMedium, backgroundColor: "#221830", border: "1px solid #B89ADA30" }}>
            <div><Text size={300} weight="medium" block>Load All Demo Data</Text><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Nodes, configs, M365, agents, Purview labels, drift events</Text></div>
            <Button appearance="primary" icon={<ArrowSync20Regular />} disabled={seeding} onClick={handleSeed}>{seeding ? "Loading..." : "Seed Data"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader><CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Settings20Regular style={{ color: tokens.colorNeutralForeground3 }} /> About</span></CardTitle></CardHeader>
        <CardContent>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginBottom: 16 }} block>
            DSC Dashboard integrates PowerShell DSC v3, Microsoft365DSC, Purview, and Agent 365 into a unified compliance interface.
          </Text>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="https://learn.microsoft.com/en-us/powershell/dsc/overview?view=dsc-3.0" target="_blank" rel="noopener noreferrer"><Button appearance="outline" size="small" icon={<Open20Regular />}>DSC Docs</Button></a>
            <a href="https://learn.microsoft.com/en-us/graph/api/tenantdatasecurityandgovernance-list-sensitivitylabels" target="_blank" rel="noopener noreferrer"><Button appearance="outline" size="small" icon={<Open20Regular />}>Purview API</Button></a>
            <a href="https://github.com/PowerShell/DSC" target="_blank" rel="noopener noreferrer"><Button appearance="outline" size="small" icon={<Open20Regular />}>GitHub</Button></a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordSection() {
  const styles = useStyles();
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
      const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); setCurrentPassword(""); setNewPassword(""); setConfirm(""); }
      else setError(data.error);
    } catch { setError("Failed to change password"); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle><span style={{ display: "flex", alignItems: "center", gap: 8 }}><LockClosed20Regular style={{ color: tokens.colorNeutralForeground3 }} /> Change Password</span></CardTitle>
        <CardDescription>Update your password. All other sessions will be signed out.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <Field label="Current Password"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword((e.target as HTMLInputElement).value)} appearance="filled-darker" required /></Field>
          <Field label="New Password"><Input type="password" placeholder="Min 10 chars, upper+lower+number+special" value={newPassword} onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)} appearance="filled-darker" required /></Field>
          <Field label="Confirm New Password"><Input type="password" value={confirm} onChange={(e) => setConfirm((e.target as HTMLInputElement).value)} appearance="filled-darker" required /></Field>
          {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
          {success && <MessageBar intent="success"><MessageBarBody>{success}</MessageBarBody></MessageBar>}
          <Button appearance="primary" size="small" type="submit" disabled={loading} icon={<LockClosed20Regular />}>{loading ? "Updating..." : "Update Password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
