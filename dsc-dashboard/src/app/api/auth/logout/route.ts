import { NextResponse } from "next/server";
import { destroySession, getCurrentUser, securityHeaders } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  const headers = securityHeaders();
  try {
    const user = await getCurrentUser();
    await destroySession();
    if (user) writeAuditLog({ action: "LOGOUT", userId: user.id, email: user.email });
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500, headers });
  }
}
