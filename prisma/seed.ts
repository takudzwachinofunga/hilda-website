/**
 * Seeds the administrator account, default categories and site settings.
 * The admin password is read from ADMIN_PASSWORD and hashed with bcrypt before saving.
 *
 *   npm run db:seed
 *
 * Re-running is safe: categories are upserted, and the admin password is only
 * reset when ADMIN_RESET_PASSWORD=true.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import slugify from "slugify";

const db = process.env.TURSO_DATABASE_URL
  ? new PrismaClient({
      adapter: new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

const DEFAULT_CATEGORIES = [
  "News",
  "Government",
  "National Events",
  "Politics",
  "Economy",
  "Agriculture",
  "Infrastructure",
  "Diplomacy",
  "Development",
  "Speeches",
  "Official Visits",
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before seeding.");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }

  // Single-user application: there is exactly one administrator.
  const existing = await db.admin.findFirst();
  if (!existing) {
    await db.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`✓ Created administrator ${email}`);
  } else {
    const reset = process.env.ADMIN_RESET_PASSWORD === "true";
    await db.admin.update({
      where: { id: existing.id },
      data: {
        email,
        ...(reset ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
    if (reset) await db.session.deleteMany({});
    console.log(`✓ Administrator ${email} ${reset ? "updated (password reset)" : "already exists"}`);
  }

  for (const name of DEFAULT_CATEGORIES) {
    const slug = slugify(name, { lower: true, strict: true });
    await db.category.upsert({ where: { slug }, create: { name, slug }, update: {} });
  }
  console.log(`✓ ${DEFAULT_CATEGORIES.length} default categories ready`);

  await db.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      siteName: process.env.SITE_NAME || "ZimWatchline",
      authorName: process.env.AUTHOR_NAME || "Hilda Sena",
    },
    update: {},
  });
  console.log("✓ Site settings ready");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
