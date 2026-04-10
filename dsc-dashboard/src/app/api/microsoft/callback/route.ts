import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens, storeRefreshToken, graphGet } from "@/lib/microsoft-graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(errorDesc || error)}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/settings?error=Missing+authorization+code", req.url));
    }

    // Validate state
    const jar = await cookies();
    const storedState = jar.get("__ms_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL("/settings?error=Invalid+state+parameter", req.url));
    }

    // Get PKCE verifier
    const verifier = jar.get("__ms_pkce_verifier")?.value;
    if (!verifier) {
      return NextResponse.redirect(new URL("/settings?error=Missing+PKCE+verifier", req.url));
    }

    // Clean up OAuth cookies
    jar.delete("__ms_pkce_verifier");
    jar.delete("__ms_oauth_state");

    // Parse state to get user ID
    const statePayload = JSON.parse(Buffer.from(state, "base64url").toString());
    const userId = statePayload.userId;

    // Check state isn't too old (10 min max)
    if (Date.now() - statePayload.ts > 600000) {
      return NextResponse.redirect(new URL("/settings?error=Authorization+expired", req.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, verifier);

    // Get user profile and org info from Graph
    const profile = await graphGet(tokens.accessToken, "/me") as { mail?: string; userPrincipalName?: string };
    const org = await graphGet(tokens.accessToken, "/organization") as { value: Array<{ id: string; displayName: string; verifiedDomains: Array<{ name: string; isDefault: boolean }> }> };

    const orgInfo = org.value?.[0];
    const azureTenantId = orgInfo?.id || "unknown";
    const orgName = orgInfo?.displayName || "Unknown Organization";
    const defaultDomain = orgInfo?.verifiedDomains?.find((d) => d.isDefault)?.name || profile.mail?.split("@")[1] || "unknown.com";
    const userEmail = profile.mail || profile.userPrincipalName || "unknown";

    // Upsert tenant
    const tenantIdKey = azureTenantId.toLowerCase();
    let tenant = await prisma.m365Tenant.findUnique({ where: { tenantId: tenantIdKey } });

    if (!tenant) {
      tenant = await prisma.m365Tenant.create({
        data: {
          tenantId: tenantIdKey,
          tenantName: `${defaultDomain.split(".")[0]}.onmicrosoft.com`,
          displayName: orgName,
          defaultDomain,
          userId,
        },
      });
    }

    // Store encrypted refresh token
    const scopes = tokens.scope.split(" ").filter(Boolean);
    await storeRefreshToken(tenant.id, tokens.refreshToken, scopes, userEmail, azureTenantId);

    return NextResponse.redirect(new URL("/settings?connected=true", req.url));
  } catch (error) {
    console.error("Microsoft OAuth callback error:", error);
    const msg = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}
