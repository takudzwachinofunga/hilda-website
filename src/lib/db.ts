import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function createClient() {
  // Production on serverless hosts: use Turso / libSQL for persistent SQLite.
  if (process.env.TURSO_DATABASE_URL) {
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  // Local / VPS: a SQLite file referenced by DATABASE_URL (e.g. file:./dev.db).
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "No database configured. Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) when " +
        "deploying to a serverless host such as Vercel, or DATABASE_URL " +
        '(e.g. "file:./dev.db") for local development. A SQLite file cannot be used ' +
        "on Vercel: the filesystem is read-only and is discarded between requests.",
    );
  }
  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  // One client per process: reused across hot reloads in development and across
  // warm invocations of the same serverless instance in production.
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * The Prisma client, created on first use rather than on import.
 *
 * This laziness matters for deployment: `next build` imports every route's module
 * graph to collect page data, so a client constructed at import time would fail
 * the build on any machine without database credentials — including a first
 * deploy to Vercel before the environment variables are set. Connecting only when
 * a query actually runs keeps the build independent of the database.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = client();
    const value = instance[property as keyof PrismaClient];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(instance) : value;
  },
});
