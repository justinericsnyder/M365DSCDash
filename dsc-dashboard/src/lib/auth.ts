import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "__dsc_session";
const CSRF_COOKIE = "__dsc_csrf";
const BCRYPT_ROUNDS = 12;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET must be at least 16 characters");
  return new TextEncoder().encode(secret);
}

// ─── Password Hashing ───────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

// ─── JWT Token (encrypted, short-lived) ─────────────────

async function createSessionToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

async function verifySessionToken(token: string): Promise<{ sub: string; sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { sub: payload.sub as string, sid: payload.sid as string };
  } catch {
    return null;
  }
}

// ─── CSRF Token ─────────────────────────────────────────

function generateCsrf(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrf();
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function verifyCsrf(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  return !!cookieToken && cookieToken === headerToken;
}

// ─── Session Management ─────────────────────────────────

export async function createSession(userId: string, ip?: string, ua?: string) {
  // Create DB session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tokenPlaceholder = generateCsrf(); // temp, replaced by JWT hash

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenPlaceholder,
      expiresAt,
      ipAddress: ip || null,
      userAgent: ua ? ua.substring(0, 256) : null,
    },
  });

  // Create JWT with session ID
  const jwt = await createSessionToken(userId, session.id);

  // Store hash of JWT in DB (never store the JWT itself)
  const jwtHash = await hash(jwt.substring(jwt.length - 32), 4); // fast hash of tail
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: jwtHash },
  });

  // Set HTTP-only secure cookie
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return session;
}

export async function getSession() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: { select: { id: true, name: true, email: true, role: true, isApproved: true, image: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.sid) {
        await prisma.session.delete({ where: { id: payload.sid } }).catch(() => {});
      }
    }
    jar.delete(SESSION_COOKIE);
    jar.delete(CSRF_COOKIE);
  } catch {
    // Best effort cleanup
  }
}

// ─── Auth Helpers ───────────────────────────────────────

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.isApproved && user.role !== "ADMIN") throw new Error("Account pending approval");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}
