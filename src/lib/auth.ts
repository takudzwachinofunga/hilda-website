import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

export const SESSION_COOKIE = "fd_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 1000 * 60 * 15; // 15 minutes
const LOCK_MS = 1000 * 60 * 15;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), adminId, expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistically clear expired sessions.
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

/** Returns the signed-in administrator, or null. Verified against the database. */
export const getCurrentAdmin = cache(async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.admin;
});

/** Use at the top of every admin page, server action and API route. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Returns the number of seconds the caller must wait, or 0 if allowed. */
export async function checkLoginRateLimit(keys: string[]) {
  const now = Date.now();
  const rows = await db.loginAttempt.findMany({ where: { key: { in: keys } } });
  let wait = 0;
  for (const row of rows) {
    if (row.lockedUntil && row.lockedUntil.getTime() > now) {
      wait = Math.max(wait, Math.ceil((row.lockedUntil.getTime() - now) / 1000));
    }
  }
  return wait;
}

export async function recordFailedLogin(keys: string[]) {
  const now = new Date();
  for (const key of keys) {
    const row = await db.loginAttempt.findUnique({ where: { key } });
    const windowExpired = !row || now.getTime() - row.windowStart.getTime() > WINDOW_MS;
    const count = windowExpired ? 1 : row.count + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCK_MS) : null;
    await db.loginAttempt.upsert({
      where: { key },
      create: { key, count, windowStart: now, lockedUntil },
      update: {
        count,
        windowStart: windowExpired ? now : undefined,
        lockedUntil,
      },
    });
  }
}

export async function clearLoginAttempts(keys: string[]) {
  await db.loginAttempt.deleteMany({ where: { key: { in: keys } } });
}
