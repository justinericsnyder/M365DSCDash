import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheInvalidate } from "@/lib/redis";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const config = await prisma.configuration.findUnique({
      where: { id },
      include: {
        resources: {
          include: { driftEvents: { take: 5, orderBy: { createdAt: "desc" } } },
        },
        nodes: {
          include: { node: true },
        },
      },
    });
    if (!config) return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (error) {
    console.error("Config GET error:", error);
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const config = await prisma.configuration.update({
      where: { id },
      data: body,
    });
    await cacheInvalidate("configs:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json(config);
  } catch (error) {
    console.error("Config PATCH error:", error);
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.configuration.delete({ where: { id } });
    await cacheInvalidate("configs:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Config DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete configuration" }, { status: 500 });
  }
}
