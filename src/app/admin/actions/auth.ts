"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import {
  checkLoginRateLimit,
  clearLoginAttempts,
  createSession,
  destroySession,
  getClientIp,
  hashPassword,
  recordFailedLogin,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/utils-text";

export type LoginState = { error?: string; email?: string };

// Used to equalise timing when the email does not exist.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  if (!email || !password) return { error: "Enter your email and password.", email };

  const ip = await getClientIp();
  const keys = [`ip:${ip}`, `ip:${ip}|email:${email}`];
  const wait = await checkLoginRateLimit(keys);
  if (wait > 0) {
    return {
      error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`,
      email,
    };
  }

  const admin = await db.admin.findUnique({ where: { email } });
  const valid = await verifyPassword(password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !valid) {
    await recordFailedLogin(keys);
    return { error: "Incorrect email or password.", email };
  }

  await clearLoginAttempts(keys);
  await createSession(admin.id);
  const next = str(formData.get("next"));
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
