import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";
import { parseDSCDocument } from "@/lib/dsc-parser";
import { resolveInfraContext } from "@/lib/tenant-resolver";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveInfraContext();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const cacheKey = `configs:${ctx.userId}:${status || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = { userId: ctx.userId };
    if (status) where.status = status;

    const configs = await prisma.configuration.findMany({
      where,
      include: {
        resources: { select: { id: true, name: true, resourceType: true, inDesiredState: true } },
        nodes: { include: { node: { select: { name: true, status: true } } } },
        _count: { select: { resources: true, nodes: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    await cacheSet(cacheKey, configs, 15);
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Configs GET error:", error);
    return NextResponse.json({ error: "Failed to load configurations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-001";

    const body = await req.json();
    let document = body.document;
    if (typeof document === "string") {
      const parsed = parseDSCDocument(document);
      if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
      document = parsed.data;
    }

    const config = await prisma.configuration.create({
      data: { name: body.name, description: body.description, document: document as object, status: body.status || "DRAFT", userId },
    });

    if (document?.resources) {
      for (const res of document.resources as Array<{ name: string; type: string; properties?: object }>) {
        await prisma.resourceInstance.create({
          data: { name: res.name, resourceType: res.type, properties: (res.properties || {}) as object, desiredState: (res.properties || {}) as object, configurationId: config.id },
        });
      }
    }

    await cacheInvalidate("configs:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Configs POST error:", error);
    return NextResponse.json({ error: "Failed to create configuration" }, { status: 500 });
  }
}
