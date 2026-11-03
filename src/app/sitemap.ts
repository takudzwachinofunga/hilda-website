import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [articles, events] = await Promise.all([
    db.article.findMany({
      where: publishedWhere(),
      select: { slug: true, updatedAt: true, featuredImage: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.event.findMany({ select: { slug: true, updatedAt: true, coverImage: true } }),
  ]);
  const latest = articles[0]?.updatedAt ?? new Date();

  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${base}/news`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/events`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery`, changeFrequency: "weekly", priority: 0.6 },
    ...articles.map((a) => ({
      url: `${base}/news/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: a.featuredImage ? [a.featuredImage] : undefined,
    })),
    ...events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: e.coverImage ? [e.coverImage] : undefined,
    })),
  ];
}
