import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      where: { passwordHash: { not: null } },
      select: {
        id: true, name: true, email: true, role: true,
        isApproved: true, approvedBy: true, approvedAt: true,
        lastLoginAt: true, createdAt: true,
        _count: { select: { sessions: true, tenants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    if (msg === "Admin access required") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.user.update({
        where: { id: userId },
        data: { isApproved: true, role: "USER", approvedBy: admin.id, approvedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "User approved" });
    }

    if (action === "reject") {
      // Delete the user and their sessions
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "User rejected and removed" });
    }

    if (action === "revoke") {
      await prisma.user.update({
        where: { id: userId },
        data: { isApproved: false, role: "PENDING" },
      });
      await prisma.session.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true, message: "User access revoked" });
    }

    if (action === "promote") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "ADMIN", isApproved: true },
      });
      return NextResponse.json({ success: true, message: "User promoted to admin" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    if (msg === "Admin access required") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
