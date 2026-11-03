import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";

export const getSettings = cache(async () => {
  const existing = await db.setting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return db.setting.create({ data: { id: 1 } });
});

/**
 * The site's public origin, used for canonical links, metadata, social sharing,
 * robots.txt and the sitemap.
 *
 * NEXT_PUBLIC_SITE_URL wins, so a custom domain is always honoured. Without it,
 * a Vercel deployment describes itself: production uses the project's production
 * domain, previews use their own deployment URL. Otherwise, local development.
 */
export function siteUrl() {
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || vercelHost;
  if (!configured) return "http://localhost:3000";
  // Vercel supplies a bare host; a hand-set value may also omit the scheme, and
  // metadataBase would throw on a URL without one.
  const withScheme = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  return withScheme.replace(/\/+$/, "");
}
