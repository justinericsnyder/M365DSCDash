import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Emergency endpoint to clear rate limits and lockouts
// In production, this should be protected or removed
export async function POST(req: NextRequest) {
  try {
    // Clear all rate limit and lockout keys
    const keys = await redis.keys("ratelimit:*");
    const lockoutKeys = await redis.keys("lockout:*");
    const allKeys = [...keys, ...lockoutKeys];
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    return NextResponse.json({ 
      success: true, 
      cleared: allKeys.length,
      message: `Cleared ${keys.length} rate limits and ${lockoutKeys.length} lockouts` 
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
