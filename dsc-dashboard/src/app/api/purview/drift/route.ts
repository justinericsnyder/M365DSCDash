import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheInvalidate } from "@/lib/redis";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, resolved } = body;
    const event = await prisma.purviewLabelDrift.update({
      where: { id },
      data: { resolved, resolvedAt: resolved ? new Date() : null },
    });
    await cacheInvalidate("purview:*");
    return NextResponse.json(event);
  } catch (error) {
    console.error("Purview drift PATCH error:", error);
    return NextResponse.json({ error: "Failed to update drift event" }, { status: 500 });
  }
}
