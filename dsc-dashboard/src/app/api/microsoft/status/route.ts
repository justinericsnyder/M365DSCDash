import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, securityHeaders } from "@/lib/auth";

export async function GET() {
  const headers = securityHeaders();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ connected: false, authenticated: false }, { headers });
    }

    const tenant = await prisma.m365Tenant.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        tenantId: true,
        displayName: true,
        tenantName: true,
        defaultDomain: true,
        isConnected: true,
        connectionError: true,
        connectedUserEmail: true,
        tokenScopes: true,
        lastSyncAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ connected: false, authenticated: true, hasTenant: false }, { headers });
    }

    return NextResponse.json({
      connected: tenant.isConnected,
      authenticated: true,
      hasTenant: true,
      tenant: {
        id: tenant.id,
        tenantId: tenant.tenantId,
        displayName: tenant.displayName,
        tenantName: tenant.tenantName,
        defaultDomain: tenant.defaultDomain,
        connectedUserEmail: tenant.connectedUserEmail,
        scopes: tenant.tokenScopes,
        lastSyncAt: tenant.lastSyncAt,
        error: tenant.connectionError,
      },
    }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
