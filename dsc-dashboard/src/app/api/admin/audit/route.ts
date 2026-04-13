import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, securityHeaders } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const headers = securityHeaders();
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "50")));
    const action = url.searchParams.get("action") || undefined;
    const email = url.searchParams.get("email") || undefined;

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (email) where.email = { contains: email, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: msg.includes("Admin") ? 403 : 500, headers });
  }
}
