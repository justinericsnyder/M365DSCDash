import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength, checkRateLimit, securityHeaders } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(10).max(128),
});

export async function POST(req: NextRequest) {
  const headers = securityHeaders();

  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip") || "unknown";
    const rate = await checkRateLimit(`register:${ip}`);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Try again in ${Math.ceil(rate.resetIn / 60)} minutes.` },
        { status: 429, headers: { ...headers, "Retry-After": String(rate.resetIn) } }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400, headers });
    }

    const { name, email, password } = parsed.data;

    // Strong password validation
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400, headers });
    }

    // Check if email already exists (use generic error to prevent enumeration)
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "Unable to create account. If you already have an account, try signing in." },
        { status: 409, headers }
      );
    }

    // First user with a password becomes admin
    const userCount = await prisma.user.count({ where: { passwordHash: { not: null } } });
    const isFirstUser = userCount === 0;

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: isFirstUser ? "ADMIN" : "PENDING",
        isApproved: isFirstUser,
        approvedAt: isFirstUser ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      isFirstUser,
      message: isFirstUser
        ? "Admin account created. You can now log in."
        : "Account created. An admin must approve your access before you can log in.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201, headers });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500, headers });
  }
}
