import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resolved = searchParams.get("resolved");
    const severity = searchParams.get("severity");

    const cacheKey = `drift:${resolved || "all"}:${severity || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};
    if (resolved !== null) where.resolved = resolved === "true";
    if (severity) where.severity = severity;

    const events = await prisma.driftEvent.findMany({
      where,
      include: {
        node: { select: { id: true, name: true, hostname: true, platform: true } },
        resourceInstance: { select: { id: true, name: true, resourceType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    await cacheSet(cacheKey, events, 15);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Drift GET error:", error);
    return NextResponse.json({ error: "Failed to load drift events" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, resolved } = body;

    const event = await prisma.driftEvent.update({
      where: { id },
      data: { resolved, resolvedAt: resolved ? new Date() : null },
    });

    await cacheInvalidate("drift:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json(event);
  } catch (error) {
    console.error("Drift PATCH error:", error);
    return NextResponse.json({ error: "Failed to update drift event" }, { status: 500 });
  }
}
