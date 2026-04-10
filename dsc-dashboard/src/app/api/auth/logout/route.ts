import { NextResponse } from "next/server";
import { destroySession, securityHeaders } from "@/lib/auth";

export async function POST() {
  const headers = securityHeaders();
  try {
    await destroySession();
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500, headers });
  }
}
