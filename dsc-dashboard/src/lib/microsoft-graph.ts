import { prisma } from "./db";
import { encrypt, decrypt } from "./crypto";

// ─── OAuth2 Configuration ───────────────────────────────
// Multi-tenant app: users consent in their own tenant
// No client secrets from users are ever stored

const TENANT_SLUG = process.env.AZURE_TENANT_ID || "organizations";
const MICROSOFT_AUTH_URL = `https://login.microsoftonline.com/${TENANT_SLUG}/oauth2/v2.0/authorize`;
const MICROSOFT_TOKEN_URL = `https://login.microsoftonline.com/${TENANT_SLUG}/oauth2/v2.0/token`;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const GRAPH_BETA = "https://graph.microsoft.com/beta";

function getClientId(): string {
  const id = process.env.AZURE_CLIENT_ID;
  if (!id) throw new Error("AZURE_CLIENT_ID not configured");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.AZURE_CLIENT_SECRET;
  if (!secret) throw new Error("AZURE_CLIENT_SECRET not configured");
  return secret;
}

function getRedirectUri(): string {
  // Use explicit NEXTAUTH_URL first, trimmed to remove any whitespace/newlines
  const url = (process.env.NEXTAUTH_URL || "").trim();
  if (url) return `${url}/api/microsoft/callback`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}/api/microsoft/callback`;
  return "http://localhost:3000/api/microsoft/callback";
}

// Required Graph API permissions
const SCOPES = [
  "offline_access",                    // Refresh token
  "User.Read",                         // Basic profile
  "Organization.Read.All",             // Tenant info
  "Directory.Read.All",                // Group settings, domains
  "Policy.Read.All",                   // Conditional access, auth methods, security defaults
  "SensitivityLabel.Read",             // Purview labels
].join(" ");

// ─── OAuth2 Authorization Code + PKCE ───────────────────

export function generatePKCE(): { verifier: string; challenge: string } {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Buffer.from(array).toString("base64url");

  // S256 challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  // We'll compute SHA-256 synchronously using Node crypto
  const { createHash } = require("crypto");
  const hash = createHash("sha256").update(data).digest();
  const challenge = Buffer.from(hash).toString("base64url");

  return { verifier, challenge };
}

export function buildAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });
  return `${MICROSOFT_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || "Token exchange failed");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

export async function refreshAccessToken(encryptedRefreshToken: string, iv: string, tag: string): Promise<{
  accessToken: string;
  newRefreshToken?: string;
  newIv?: string;
  newTag?: string;
}> {
  const refreshToken = decrypt(encryptedRefreshToken, iv, tag);

  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || "Token refresh failed");
  }

  const data = await res.json();

  // If Microsoft rotated the refresh token, encrypt and return the new one
  let newRefreshToken, newIv, newTag;
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    const encrypted = encrypt(data.refresh_token);
    newRefreshToken = encrypted.ciphertext;
    newIv = encrypted.iv;
    newTag = encrypted.tag;
  }

  return {
    accessToken: data.access_token,
    newRefreshToken,
    newIv,
    newTag,
  };
}

// ─── Store / Retrieve Tokens ────────────────────────────

export async function storeRefreshToken(
  tenantDbId: string,
  refreshToken: string,
  scopes: string[],
  userEmail: string,
  azureTenantId: string,
) {
  const { ciphertext, iv, tag } = encrypt(refreshToken);

  await prisma.m365Tenant.update({
    where: { id: tenantDbId },
    data: {
      encryptedRefreshToken: ciphertext,
      refreshTokenIv: iv,
      refreshTokenTag: tag,
      tokenScopes: scopes,
      connectedUserEmail: userEmail,
      azureTenantId,
      isConnected: true,
      connectionError: null,
      lastSyncAt: new Date(),
    },
  });
}

export async function getAccessTokenForTenant(tenantDbId: string): Promise<string> {
  const tenant = await prisma.m365Tenant.findUnique({ where: { id: tenantDbId } });
  if (!tenant?.encryptedRefreshToken || !tenant.refreshTokenIv || !tenant.refreshTokenTag) {
    throw new Error("Tenant not connected. Please authorize via Microsoft.");
  }

  const result = await refreshAccessToken(
    tenant.encryptedRefreshToken,
    tenant.refreshTokenIv,
    tenant.refreshTokenTag,
  );

  // If refresh token was rotated, update the stored one
  if (result.newRefreshToken && result.newIv && result.newTag) {
    await prisma.m365Tenant.update({
      where: { id: tenantDbId },
      data: {
        encryptedRefreshToken: result.newRefreshToken,
        refreshTokenIv: result.newIv,
        refreshTokenTag: result.newTag,
        lastSyncAt: new Date(),
      },
    });
  }

  return result.accessToken;
}

// ─── Graph API Calls ────────────────────────────────────

export async function graphGet(accessToken: string, endpoint: string, beta = false): Promise<unknown> {
  const base = beta ? GRAPH_BETA : GRAPH_BASE;
  const res = await fetch(`${base}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Graph API ${res.status}: ${(err as Record<string, unknown>).message || (err as Record<string, Record<string, string>>).error?.message || "Request failed"}`
    );
  }

  return res.json();
}

export async function graphPost(accessToken: string, endpoint: string, body: unknown, beta = false): Promise<unknown> {
  const base = beta ? GRAPH_BETA : GRAPH_BASE;
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Graph API ${res.status}: ${(err as Record<string, unknown>).message || (err as Record<string, Record<string, string>>).error?.message || "Request failed"}`
    );
  }

  return res.json();
}

// ─── Disconnect ─────────────────────────────────────────

export async function disconnectTenant(tenantDbId: string) {
  await prisma.m365Tenant.update({
    where: { id: tenantDbId },
    data: {
      encryptedRefreshToken: null,
      refreshTokenIv: null,
      refreshTokenTag: null,
      tokenScopes: [],
      connectedUserEmail: null,
      azureTenantId: null,
      isConnected: false,
      connectionError: null,
    },
  });
}
