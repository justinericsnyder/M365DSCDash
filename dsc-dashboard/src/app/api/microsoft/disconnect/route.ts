import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, securityHeaders } from "@/lib/auth";
import { disconnectTenant } from "@/lib/microsoft-graph";

export async function POST() {
  const headers = securityHeaders();
  try {
    const user = await requireAuth();

    const tenant = await prisma.m365Tenant.findFirst({
      where: { userId: user.id, isConnected: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "No connected tenant found" }, { status: 404, headers });
    }

    await disconnectTenant(tenant.id);

    return NextResponse.json({ success: true, message: "Microsoft 365 disconnected" }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
