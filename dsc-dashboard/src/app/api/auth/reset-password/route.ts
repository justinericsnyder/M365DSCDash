import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength, securityHeaders } from "@/lib/auth";

// Emergency password reset — requires knowing the email
// In production, this should use email verification
export async function POST(req: NextRequest) {
  const headers = securityHeaders();
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: "email and newPassword required" }, { status: 400, headers });
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400, headers });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Clear any sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ success: true, message: "Password reset. Please log in with your new password." }, { headers });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers });
  }
}
