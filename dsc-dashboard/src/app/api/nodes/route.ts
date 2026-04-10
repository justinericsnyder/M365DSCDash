import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";
import { DEMO_USER_ID } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");

    const cacheKey = `nodes:${status || "all"}:${platform || "all"}:${search || ""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { hostname: { contains: search, mode: "insensitive" } },
      ];
    }

    const nodes = await prisma.node.findMany({
      where,
      include: {
        configurations: {
          include: { configuration: { select: { name: true, status: true } } },
        },
        _count: { select: { driftEvents: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    await cacheSet(cacheKey, nodes, 15);
    return NextResponse.json(nodes);
  } catch (error) {
    console.error("Nodes GET error:", error);
    return NextResponse.json({ error: "Failed to load nodes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const node = await prisma.node.create({
      data: {
        name: body.name,
        hostname: body.hostname,
        platform: body.platform,
        tags: body.tags || [],
        userId: DEMO_USER_ID,
      },
    });
    await cacheInvalidate("nodes:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    console.error("Nodes POST error:", error);
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
  }
}
