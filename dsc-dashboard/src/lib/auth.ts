import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { redis } from "./redis";
import { createHash, timingSafeEqual } from "crypto";

// ─── Constants ──────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";
const SESSION_COOKIE = isProd ? "__Host-dsc_session" : "dsc_session";
const CSRF_COOKIE = isProd ? "__Host-dsc_csrf" : "dsc_csrf";
const BCRYPT_ROUNDS = 12;
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_REFRESH_THRESHOLD_MS = 4 * 60 * 60 * 1000; // refresh if <4h remaining
const RATE_LIMIT_WINDOW_S = 900; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_S = 900; // 15 minutes
const LOCKOUT_MAX_FAILURES = 5;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

// ─── Password Hashing (bcrypt, 12 rounds) ───────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

// ─── Password Strength Validation ───────────────────────

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain a special character";
  return null;
}

// ─── SHA-256 Token Hashing ──────────────────────────────
// For session tokens: SHA-256 is appropriate because the input
// is a high-entropy random JWT, not a user-chosen password.
// bcrypt would be wasteful here and add latency to every request.

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ─── JWT (signed, short-lived) ──────────────────────────

async function createSessionToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

async function verifySessionToken(token: string): Promise<{ sub: string; sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || !payload.sid) return null;
    return { sub: payload.sub as string, sid: payload.sid as string };
  } catch {
    return null;
  }
}

// ─── CSRF Protection ────────────────────────────────────

function generateSecureToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setCsrfCookie(): Promise<string> {
  const token = generateSecureToken();
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return token;
}

export async function verifyCsrf(headerToken: string | null): Promise<boolean> {
  if (!headerToken || headerToken.length !== 64) return false;
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  if (!cookieToken || cookieToken.length !== 64) return false;

  // Constant-time comparison to prevent timing attacks
  try {
    const a = Buffer.from(headerToken, "utf-8");
    const b = Buffer.from(cookieToken, "utf-8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Rate Limiting (Redis-backed) ───────────────────────

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redisKey = `ratelimit:${key}`;
  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, RATE_LIMIT_WINDOW_S);
    }
    const ttl = await redis.ttl(redisKey);
    return {
      allowed: current <= RATE_LIMIT_MAX_ATTEMPTS,
      remaining: Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - current),
      resetIn: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_S,
    };
  } catch {
    // If Redis is down, allow the request (fail open for availability)
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS, resetIn: 0 };
  }
}

// ─── Account Lockout ────────────────────────────────────

export async function recordFailedLogin(email: string): Promise<boolean> {
  const key = `lockout:${sha256(email.toLowerCase())}`;
  try {
    const failures = await redis.incr(key);
    if (failures === 1) await redis.expire(key, LOCKOUT_DURATION_S);
    return failures >= LOCKOUT_MAX_FAILURES;
  } catch {
    return false;
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const key = `lockout:${sha256(email.toLowerCase())}`;
  try {
    const failures = await redis.get(key);
    return failures !== null && parseInt(failures, 10) >= LOCKOUT_MAX_FAILURES;
  } catch {
    return false;
  }
}

export async function clearFailedLogins(email: string): Promise<void> {
  const key = `lockout:${sha256(email.toLowerCase())}`;
  try { await redis.del(key); } catch { /* best effort */ }
}

// ─── Session Management ─────────────────────────────────

export async function createSession(userId: string, ip?: string, ua?: string) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Create JWT first to get the token
  const tempId = generateSecureToken().substring(0, 24);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: tempId, // placeholder
      expiresAt,
      ipAddress: ip ? ip.substring(0, 45) : null, // max IPv6 length
      userAgent: ua ? ua.substring(0, 256) : null,
    },
  });

  const jwt = await createSessionToken(userId, session.id);

  // Store SHA-256 hash of the full JWT — deterministic, fast, secure for random tokens
  const tokenHash = sha256(jwt);
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash },
  });

  // Set HTTP-only secure cookie with __Host- prefix
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  // Set CSRF cookie alongside session
  await setCsrfCookie();

  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  // Cleanup: delete expired sessions for this user (async, non-blocking)
  prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  }).catch(() => {});

  return session;
}

export async function getSession() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    // Verify JWT signature and expiration
    const payload = await verifySessionToken(token);
    if (!payload) return null;

    // Verify session exists in DB and token hash matches
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, isApproved: true, image: true },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Verify token hash matches (prevents use of revoked tokens)
    const currentHash = sha256(token);
    if (session.tokenHash !== currentHash) return null;

    // Sliding window: refresh session if close to expiry
    const timeRemaining = session.expiresAt.getTime() - Date.now();
    if (timeRemaining < SESSION_REFRESH_THRESHOLD_MS) {
      const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_MS);
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiry },
      }).catch(() => {});

      // Refresh cookie expiry
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_MAX_AGE_MS / 1000,
      });
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

// Revoke all sessions for a user (e.g., on password change or admin revoke)
export async function revokeAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
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

// ─── Secure Response Headers ────────────────────────────

export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0", // modern browsers use CSP instead
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
  };
}
