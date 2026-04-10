import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { resolveTenantContext } from "@/lib/tenant-resolver";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext();
    if (!ctx.tenantId) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const workload = searchParams.get("workload");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const cacheKey = `m365:resources:${ctx.tenantId}:${workload || "all"}:${status || "all"}:${type || "all"}:${search || ""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (workload) where.workload = workload;
    if (status) where.status = status;
    if (type) where.resourceType = { contains: type, mode: "insensitive" };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { resourceType: { contains: search, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.m365Resource.findMany({
      where,
      orderBy: [{ workload: "asc" }, { resourceType: "asc" }, { displayName: "asc" }],
    });

    await cacheSet(cacheKey, resources, 15);
    return NextResponse.json(resources);
  } catch (error) {
    console.error("M365 resources error:", error);
    return NextResponse.json({ error: "Failed to load M365 resources" }, { status: 500 });
  }
}
