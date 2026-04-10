import { NextResponse } from "next/server";
import { requireAuth, securityHeaders } from "@/lib/auth";
import { generatePKCE, buildAuthUrl } from "@/lib/microsoft-graph";
import { cookies } from "next/headers";

export async function GET() {
  const headers = securityHeaders();
  try {
    const user = await requireAuth();

    // Generate PKCE verifier and challenge
    const { verifier, challenge } = generatePKCE();

    // Generate state token (includes user ID for validation on callback)
    const statePayload = JSON.stringify({ userId: user.id, ts: Date.now() });
    const state = Buffer.from(statePayload).toString("base64url");

    // Store PKCE verifier in HTTP-only cookie (never exposed to client JS)
    const jar = await cookies();
    jar.set("__ms_pkce_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // lax needed for OAuth redirect
      path: "/",
      maxAge: 600, // 10 minutes
    });
    jar.set("__ms_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    const authUrl = buildAuthUrl(state, challenge);
    return NextResponse.json({ url: authUrl }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 401, headers });
  }
}
