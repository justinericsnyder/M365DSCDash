import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword, createSession, checkRateLimit,
  isAccountLocked, recordFailedLogin, clearFailedLogins, securityHeaders,
} from "@/lib/auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const headers = securityHeaders();

  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip") || "unknown";
    const rateKey = `login:${ip}`;
    const rate = await checkRateLimit(rateKey);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(rate.resetIn / 60)} minutes.` },
        { status: 429, headers: { ...headers, "Retry-After": String(rate.resetIn) } }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400, headers });
    }

    const { email, password } = parsed.data;

    // Check account lockout
    const locked = await isAccountLocked(email);
    if (locked) {
      return NextResponse.json(
        { error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." },
        { status: 423, headers }
      );
    }

    // Find user — always run password check to prevent timing-based user enumeration
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordHash) {
      // Simulate bcrypt timing even when user doesn't exist
      const { hash } = await import("bcryptjs");
      await hash("dummy-password-timing-safe", 4);
      await recordFailedLogin(email);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401, headers });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const isNowLocked = await recordFailedLogin(email);
      const msg = isNowLocked
        ? "Account locked due to too many failed attempts. Try again in 15 minutes."
        : "Invalid email or password";
      return NextResponse.json({ error: msg }, { status: 401, headers });
    }

    // Successful login — clear failed attempts
    await clearFailedLogins(email);

    // Check approval status
    if (!user.isApproved && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Your account is pending admin approval.", pendingApproval: true },
        { status: 403, headers }
      );
    }

    // Create session
    const ua = req.headers.get("user-agent") || undefined;
    await createSession(user.id, ip, ua);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { headers });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500, headers });
  }
}
