import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getCurrentUser, securityHeaders } from "@/lib/auth";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";

// Default flags
const DEFAULT_FLAGS: Record<string, boolean> = {
  showNodes: true,
  showConfigurations: true,
  showImport: true,
};

// GET — anyone can read flags (needed for sidebar rendering)
export async function GET() {
  const headers = securityHeaders();
  try {
    const cacheKey = "app:flags";
    const cached = await cacheGet<Record<string, boolean>>(cacheKey);
    if (cached) {
      const user = await getCurrentUser();
      return NextResponse.json({ flags: cached, isAdmin: user?.role === "ADMIN" }, { headers });
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
    const flags = settings ? { ...DEFAULT_FLAGS, ...(settings.flags as Record<string, boolean>) } : DEFAULT_FLAGS;

    await cacheSet(cacheKey, flags, 60);
    const user = await getCurrentUser();
    return NextResponse.json({ flags, isAdmin: user?.role === "ADMIN" }, { headers });
  } catch {
    return NextResponse.json({ flags: DEFAULT_FLAGS, isAdmin: false }, { headers });
  }
}

// PATCH — admin only
export async function PATCH(req: NextRequest) {
  const headers = securityHeaders();
  try {
    await requireAdmin();
    const body = await req.json();
    const { flag, enabled } = body;

    if (!flag || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "flag and enabled (boolean) required" }, { status: 400, headers });
    }

    // Get current flags
    const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
    const currentFlags = settings ? { ...DEFAULT_FLAGS, ...(settings.flags as Record<string, boolean>) } : { ...DEFAULT_FLAGS };
    currentFlags[flag] = enabled;

    // Upsert
    await prisma.appSettings.upsert({
      where: { id: "global" },
      update: { flags: currentFlags },
      create: { id: "global", flags: currentFlags },
    });

    await cacheInvalidate("app:flags");

    return NextResponse.json({ success: true, flags: currentFlags }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    if (msg === "Admin access required") return NextResponse.json({ error: msg }, { status: 403, headers });
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
