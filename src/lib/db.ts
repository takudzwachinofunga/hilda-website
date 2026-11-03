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

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
