import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const compliant = searchParams.get("compliant");

    const cacheKey = `resources:${type || "all"}:${compliant || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};
    if (type) where.resourceType = { contains: type, mode: "insensitive" };
    if (compliant !== null) where.inDesiredState = compliant === "true";

    const resources = await prisma.resourceInstance.findMany({
      where,
      include: {
        configuration: { select: { id: true, name: true, status: true } },
        _count: { select: { driftEvents: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    await cacheSet(cacheKey, resources, 15);
    return NextResponse.json(resources);
  } catch (error) {
    console.error("Resources GET error:", error);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}
