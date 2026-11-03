import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const NEWS_PAGE_SIZE = 13; // 1 lead + 12 – fits the editorial grid rhythm
export const GALLERY_PAGE_SIZE = 30;

export const articleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  featuredImageCaption: true,
  publishedAt: true,
  eventDate: true,
  eventLocation: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  event: { select: { title: true, slug: true, location: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCardData = Prisma.ArticleGetPayload<{ select: typeof articleCardSelect }>;

export function publishedWhere(): Prisma.ArticleWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() } };
}

export async function getFeaturedArticle() {
  const featured = await db.article.findFirst({
    where: { ...publishedWhere(), isFeatured: true },
    orderBy: { publishedAt: "desc" },
    select: articleCardSelect,
  });
  if (featured) return featured;
  return db.article.findFirst({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    select: articleCardSelect,
  });
}

export async function getLatestArticles(take: number, excludeIds: string[] = []) {
  return db.article.findMany({
    where: { ...publishedWhere(), id: { notIn: excludeIds } },
    orderBy: { publishedAt: "desc" },
    take,
    select: articleCardSelect,
  });
}

export async function getRecentEvents(take: number) {
  return db.event.findMany({
    orderBy: { startDate: "desc" },
    take,
    include: {
      articles: {
        where: publishedWhere(),
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { id: true, title: true, slug: true },
      },
      _count: { select: { articles: { where: publishedWhere() }, media: true } },
    },
  });
}

/** Media is public if it is not attached to a draft article. */
export function publicMediaWhere(): Prisma.MediaWhereInput {
  return {
    OR: [{ articleId: null }, { article: publishedWhere() }],
  };
}

export async function getPhotoHighlights(take: number) {
  return db.media.findMany({
    where: { type: "IMAGE", ...publicMediaWhere() },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      event: { select: { title: true, slug: true, startDate: true, location: true } },
      article: { select: { title: true, slug: true } },
    },
  });
}

export type NewsFilters = {
  q?: string;
  event?: string;
  category?: string;
  date?: string;
  from?: string;
  to?: string;
  year?: string;
  featured?: string;
  sort?: string;
  page?: string;
};

function dayBounds(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(`${value}T00:00:00.000Z`);
  const end = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(start.getTime()) ? null : { start, end };
}

export function buildNewsWhere(f: NewsFilters): Prisma.ArticleWhereInput {
  const and: Prisma.ArticleWhereInput[] = [publishedWhere()];
  const q = f.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { content: { contains: q } },
        { eventLocation: { contains: q } },
        { event: { title: { contains: q } } },
        { event: { location: { contains: q } } },
        { tags: { some: { name: { contains: q } } } },
      ],
    });
  }
  if (f.event) and.push({ event: { slug: f.event } });
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.featured === "1") and.push({ isFeatured: true });

  if (f.date) {
    const b = dayBounds(f.date);
    if (b) and.push({ publishedAt: { gte: b.start, lte: b.end } });
  } else if (f.from || f.to) {
    const from = f.from ? dayBounds(f.from) : null;
    const to = f.to ? dayBounds(f.to) : null;
    and.push({
      publishedAt: {
        ...(from ? { gte: from.start } : {}),
        ...(to ? { lte: to.end } : {}),
      },
    });
  } else if (f.year && /^\d{4}$/.test(f.year)) {
    and.push({
      publishedAt: {
        gte: new Date(`${f.year}-01-01T00:00:00.000Z`),
        lte: new Date(`${f.year}-12-31T23:59:59.999Z`),
      },
    });
  }
  return { AND: and };
}

export async function searchArticles(f: NewsFilters) {
  const where = buildNewsWhere(f);
  const page = Math.max(1, Number.parseInt(f.page ?? "1", 10) || 1);
  const [total, articles] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: { publishedAt: f.sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: articleCardSelect,
    }),
  ]);
  return { total, articles, page, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) };
}

export async function getFilterOptions() {
  const [categories, events, years] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    db.event.findMany({ orderBy: { startDate: "desc" }, select: { title: true, slug: true } }),
    db.article.findMany({
      where: publishedWhere(),
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);
  const yearSet = Array.from(
    new Set(years.map((a) => a.publishedAt?.getUTCFullYear()).filter(Boolean) as number[]),
  );
  return { categories, events, years: yearSet };
}

export async function getArticleBySlug(slug: string, opts: { includeDrafts?: boolean } = {}) {
  return db.article.findFirst({
    where: opts.includeDrafts ? { slug } : { slug, ...publishedWhere() },
    include: {
      category: true,
      event: true,
      tags: { orderBy: { name: "asc" } },
      galleryImages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export type FullArticle = NonNullable<Awaited<ReturnType<typeof getArticleBySlug>>>;

export async function getRelatedArticles(article: {
  id: string;
  eventId: string | null;
  categoryId: string | null;
  tags: { id: string }[];
}) {
  const or: Prisma.ArticleWhereInput[] = [];
  if (article.eventId) or.push({ eventId: article.eventId });
  if (article.categoryId) or.push({ categoryId: article.categoryId });
  if (article.tags.length) or.push({ tags: { some: { id: { in: article.tags.map((t) => t.id) } } } });
  const related = or.length
    ? await db.article.findMany({
        where: { ...publishedWhere(), id: { not: article.id }, OR: or },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: articleCardSelect,
      })
    : [];
  if (related.length >= 3) return related;
  const filler = await db.article.findMany({
    where: { ...publishedWhere(), id: { notIn: [article.id, ...related.map((r) => r.id)] } },
    orderBy: { publishedAt: "desc" },
    take: 3 - related.length,
    select: articleCardSelect,
  });
  return [...related, ...filler];
}

export async function getEvents(f: { q?: string; year?: string }) {
  const where: Prisma.EventWhereInput = {};
  if (f.q) where.OR = [{ title: { contains: f.q } }, { location: { contains: f.q } }];
  if (f.year && /^\d{4}$/.test(f.year)) {
    where.startDate = {
      gte: new Date(`${f.year}-01-01T00:00:00.000Z`),
      lte: new Date(`${f.year}-12-31T23:59:59.999Z`),
    };
  }
  return db.event.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { articles: { where: publishedWhere() }, media: true } },
    },
  });
}

export async function getEventBySlug(slug: string) {
  return db.event.findUnique({
    where: { slug },
    include: {
      articles: {
        where: publishedWhere(),
        orderBy: { publishedAt: "desc" },
        select: articleCardSelect,
      },
      media: {
        where: publicMediaWhere(),
        orderBy: { createdAt: "asc" },
        include: { article: { select: { title: true, slug: true } } },
      },
    },
  });
}

export type GalleryFilters = {
  event?: string;
  date?: string;
  year?: string;
  type?: string;
  page?: string;
};

export async function getGalleryMedia(f: GalleryFilters) {
  const and: Prisma.MediaWhereInput[] = [publicMediaWhere()];
  if (f.type === "image") and.push({ type: "IMAGE" });
  if (f.type === "video") and.push({ type: "VIDEO" });
  if (f.event) and.push({ event: { slug: f.event } });
  if (f.date) {
    const b = dayBounds(f.date);
    if (b) {
      and.push({
        OR: [
          { takenAt: { gte: b.start, lte: b.end } },
          { takenAt: null, event: { startDate: { gte: b.start, lte: b.end } } },
          { takenAt: null, eventId: null, createdAt: { gte: b.start, lte: b.end } },
        ],
      });
    }
  } else if (f.year && /^\d{4}$/.test(f.year)) {
    const start = new Date(`${f.year}-01-01T00:00:00.000Z`);
    const end = new Date(`${f.year}-12-31T23:59:59.999Z`);
    and.push({
      OR: [
        { takenAt: { gte: start, lte: end } },
        { takenAt: null, event: { startDate: { gte: start, lte: end } } },
        { takenAt: null, eventId: null, createdAt: { gte: start, lte: end } },
      ],
    });
  }
  const where = { AND: and };
  const page = Math.max(1, Number.parseInt(f.page ?? "1", 10) || 1);
  const [total, media] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * GALLERY_PAGE_SIZE,
      take: GALLERY_PAGE_SIZE,
      include: {
        event: { select: { title: true, slug: true, startDate: true, location: true } },
        article: { select: { title: true, slug: true } },
      },
    }),
  ]);
  return { total, media, page, pageCount: Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE)) };
}

export type GalleryItem = Awaited<ReturnType<typeof getGalleryMedia>>["media"][number];
