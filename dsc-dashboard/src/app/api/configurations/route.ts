import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";
import { parseDSCDocument } from "@/lib/dsc-parser";
import { DEMO_USER_ID } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const cacheKey = `configs:${status || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};
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
    const body = await req.json();

    // Validate DSC document if provided as string
    let document = body.document;
    if (typeof document === "string") {
      const parsed = parseDSCDocument(document);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      document = parsed.data;
    }

    const config = await prisma.configuration.create({
      data: {
        name: body.name,
        description: body.description,
        document: document as object,
        status: body.status || "DRAFT",
        userId: DEMO_USER_ID,
      },
    });

    // Create resource instances from the document
    if (document?.resources) {
      for (const res of document.resources as Array<{ name: string; type: string; properties?: object }>) {
        await prisma.resourceInstance.create({
          data: {
            name: res.name,
            resourceType: res.type,
            properties: (res.properties || {}) as object,
            desiredState: (res.properties || {}) as object,
            configurationId: config.id,
          },
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
