import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext();
    if (!ctx.tenantId) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const blocked = searchParams.get("blocked");
    const deployed = searchParams.get("deployed");
    const search = searchParams.get("search");
    const host = searchParams.get("host");

    const cacheKey = `agents:${ctx.tenantId}:${type || "all"}:${blocked || "all"}:${deployed || "all"}:${host || "all"}:${search || ""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (type) where.type = type;
    if (blocked !== null && blocked !== "") where.isBlocked = blocked === "true";
    if (deployed === "deployed") where.deployedTo = { not: "none" };
    if (deployed === "not_deployed") where.deployedTo = "none";
    if (host) where.supportedHosts = { has: host };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
      ];
    }

    const agents = await prisma.agent365.findMany({ where, orderBy: [{ type: "asc" }, { displayName: "asc" }] });
    await cacheSet(cacheKey, agents, 15);
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Agents error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
