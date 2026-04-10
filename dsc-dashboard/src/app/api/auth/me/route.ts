import { NextResponse } from "next/server";
import { getCurrentUser, securityHeaders } from "@/lib/auth";

export async function GET() {
  const headers = securityHeaders();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { headers });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    }, { headers });
  } catch {
    return NextResponse.json({ authenticated: false }, { headers });
  }
}
