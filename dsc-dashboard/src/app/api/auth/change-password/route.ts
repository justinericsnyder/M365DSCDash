import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, hashPassword, verifyPassword, validatePasswordStrength, securityHeaders, revokeAllSessions, createSession, verifyCsrf } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const headers = securityHeaders();
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400, headers });
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400, headers });

    // Verify current password
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash) {
      return NextResponse.json({ error: "No password set" }, { status: 400, headers });
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      console.log(`[AUDIT] Failed password change attempt for ${user.email} from ${req.headers.get("x-forwarded-for")}`);
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401, headers });
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    // Audit log
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    console.log(`[AUDIT] Password changed for ${user.email} by user ${user.id} from IP ${ip} UA: ${ua.substring(0, 80)}`);

    // Revoke all sessions and create a new one
    await revokeAllSessions(user.id);
    await createSession(user.id, ip, ua);

    return NextResponse.json({ success: true, message: "Password updated. All other sessions have been signed out." }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
