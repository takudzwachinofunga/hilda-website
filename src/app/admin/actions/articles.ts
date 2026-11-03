"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { type ActionState, isHttpUrl, revalidateSite, uniqueSlug } from "@/lib/action-utils";
import { optionalStr, parseDateInput, slugify, str, stripHtml } from "@/lib/utils-text";

function parseIdList(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(typeof value === "string" ? value : "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function parseTags(value: string) {
  const seen = new Map<string, string>();
  for (const raw of value.split(",")) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const slug = slugify(name);
    if (!seen.has(slug)) seen.set(slug, name.slice(0, 48));
  }
  return Array.from(seen, ([slug, name]) => ({ slug, name })).slice(0, 20);
}

export async function saveArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = optionalStr(formData.get("id"));
  const intent = str(formData.get("intent")); // "draft" | "publish" | "preview" | "save"
  const title = str(formData.get("title"));
  const excerpt = str(formData.get("excerpt"));
  const content = sanitizeArticleHtml(str(formData.get("content")));
  const featuredImage = optionalStr(formData.get("featuredImage"));
  const featuredImageCaption = optionalStr(formData.get("featuredImageCaption"));
  const videoUrl = optionalStr(formData.get("videoUrl"));
  const categoryId = optionalStr(formData.get("categoryId"));
  const eventId = optionalStr(formData.get("eventId"));
  const eventLocation = optionalStr(formData.get("eventLocation"));
  const eventDate = parseDateInput(formData.get("eventDate"));
  const publishedAtInput = parseDateInput(formData.get("publishedAt"));
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const galleryIds = parseIdList(formData.get("galleryIds"));
  const tags = parseTags(str(formData.get("tags")));

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "A headline is required.";
  if (title.length > 200) fieldErrors.title = "Keep the headline under 200 characters.";
  if (excerpt.length > 400) fieldErrors.excerpt = "Keep the excerpt under 400 characters.";
  if (featuredImage && !isHttpUrl(featuredImage)) fieldErrors.featuredImage = "Invalid image URL.";
  if (videoUrl && !isHttpUrl(videoUrl)) fieldErrors.videoUrl = "Enter a valid video URL.";
  if (intent === "publish") {
    if (!stripHtml(content)) fieldErrors.content = "Write the article before publishing.";
  }
  if (Object.keys(fieldErrors).length) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const existing = id ? await db.article.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "This article no longer exists." };

  if (categoryId && !(await db.category.findUnique({ where: { id: categoryId } }))) {
    return { error: "Selected category no longer exists." };
  }
  if (eventId && !(await db.event.findUnique({ where: { id: eventId } }))) {
    return { error: "Selected event no longer exists." };
  }

  const slug = await uniqueSlug("article", str(formData.get("slug")) || title, existing?.id);

  let status = existing?.status ?? "DRAFT";
  if (intent === "publish") status = "PUBLISHED";
  if (intent === "draft") status = "DRAFT";

  let publishedAt = existing?.publishedAt ?? null;
  if (publishedAtInput) {
    const sameDay = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
    const now = new Date();
    if (publishedAt && sameDay(publishedAtInput, publishedAt)) {
      // Unchanged date: keep the exact original timestamp.
    } else if (sameDay(publishedAtInput, now)) {
      publishedAt = now;
    } else {
      // Back-dated (or scheduled, if in the future) to midday on the chosen date.
      publishedAt = publishedAtInput;
    }
  }
  if (status === "PUBLISHED" && !publishedAt) publishedAt = new Date();

  let article: { id: string };
  try {
    const tagConnect: { id: string }[] = [];
    for (const t of tags) {
      // Match on slug or name so differently-punctuated duplicates reuse one tag.
      const found = await db.tag.findFirst({
        where: { OR: [{ slug: t.slug }, { name: t.name }] },
        select: { id: true },
      });
      tagConnect.push(found ?? (await db.tag.create({ data: t, select: { id: true } })));
    }

    const validGallery = galleryIds.length
      ? await db.media.findMany({ where: { id: { in: galleryIds } }, select: { id: true } })
      : [];

    const data = {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      featuredImageCaption,
      videoUrl,
      categoryId,
      eventId,
      eventDate,
      eventLocation,
      status,
      isFeatured,
      publishedAt,
    };

    article = existing
      ? await db.article.update({
          where: { id: existing.id },
          data: {
            ...data,
            tags: { set: tagConnect },
            galleryImages: { set: validGallery },
          },
        })
      : await db.article.create({
          data: {
            ...data,
            tags: { connect: tagConnect },
            galleryImages: { connect: validGallery },
          },
        });

    // Gallery images without a primary article/event inherit this article's context.
    if (validGallery.length) {
      await db.media.updateMany({
        where: { id: { in: validGallery.map((m) => m.id) }, articleId: null },
        data: { articleId: article.id },
      });
      if (eventId) {
        await db.media.updateMany({
          where: { id: { in: validGallery.map((m) => m.id) }, eventId: null },
          data: { eventId },
        });
      }
    }

    // Remove tags no longer used by any article.
    await db.tag.deleteMany({ where: { articles: { none: {} } } });
  } catch (err) {
    console.error("saveArticle failed", err);
    return { error: "The article could not be saved. Please try again." };
  }

  revalidateSite();

  if (intent === "preview") redirect(`/admin/preview/${article.id}`);
  if (!existing) redirect(`/admin/articles/${article.id}/edit?saved=${status === "PUBLISHED" ? "published" : "draft"}`);

  return {
    ok: true,
    message:
      intent === "publish"
        ? "Article published."
        : intent === "draft"
          ? status === "DRAFT" && existing.status === "PUBLISHED"
            ? "Article unpublished and saved as draft."
            : "Draft saved."
          : "Changes saved.",
  };
}

export async function deleteArticle(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  await db.media.updateMany({ where: { articleId: id }, data: { articleId: null } });
  await db.article.delete({ where: { id } }).catch(() => null);
  await db.tag.deleteMany({ where: { articles: { none: {} } } });
  revalidateSite();
  if (formData.get("redirect") === "list") redirect("/admin/articles?deleted=1");
}

export async function setArticleStatus(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  const status = str(formData.get("status")) === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return;
  await db.article.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? (article.publishedAt ?? new Date()) : article.publishedAt,
    },
  });
  revalidateSite();
}

export async function toggleFeatured(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  const article = await db.article.findUnique({ where: { id }, select: { isFeatured: true } });
  if (!article) return;
  await db.article.update({ where: { id }, data: { isFeatured: !article.isFeatured } });
  revalidateSite();
}
