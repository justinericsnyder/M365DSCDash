import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

// Debug endpoint — check auth state (remove in production)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase();

    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, isApproved: true, passwordHash: true },
    });

    // Check Redis state
    const { createHash } = require("crypto");
    const lockoutKey = `lockout:${createHash("sha256").update(email).digest("hex")}`;
    const lockoutVal = await redis.get(lockoutKey).catch(() => "redis_error");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateKey = `ratelimit:login:${ip}`;
    const rateVal = await redis.get(rateKey).catch(() => "redis_error");

    // Check all rate/lockout keys
    const allRateKeys = await redis.keys("ratelimit:*").catch(() => []);
    const allLockoutKeys = await redis.keys("lockout:*").catch(() => []);

    return NextResponse.json({
      userExists: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      userApproved: user?.isApproved,
      hasPasswordHash: !!user?.passwordHash,
      passwordHashLength: user?.passwordHash?.length,
      lockoutKey,
      lockoutValue: lockoutVal,
      rateKey,
      rateValue: rateVal,
      ip,
      allRateKeys,
      allLockoutKeys,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
