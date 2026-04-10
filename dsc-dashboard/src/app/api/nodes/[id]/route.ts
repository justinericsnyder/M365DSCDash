import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheInvalidate } from "@/lib/redis";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        configurations: {
          include: { configuration: true },
        },
        driftEvents: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { resourceInstance: { select: { name: true, resourceType: true } } },
        },
      },
    });
    if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
    return NextResponse.json(node);
  } catch (error) {
    console.error("Node GET error:", error);
    return NextResponse.json({ error: "Failed to load node" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const node = await prisma.node.update({
      where: { id },
      data: body,
    });
    await cacheInvalidate("nodes:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json(node);
  } catch (error) {
    console.error("Node PATCH error:", error);
    return NextResponse.json({ error: "Failed to update node" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.node.delete({ where: { id } });
    await cacheInvalidate("nodes:*");
    await cacheInvalidate("dashboard:*");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Node DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete node" }, { status: 500 });
  }
}
