"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ActionState, isHttpUrl, revalidateSite, uniqueSlug } from "@/lib/action-utils";
import { optionalStr, parseDateInput, str } from "@/lib/utils-text";

function parseIdList(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(typeof value === "string" ? value : "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = optionalStr(formData.get("id"));
  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  const location = optionalStr(formData.get("location"));
  const coverImage = optionalStr(formData.get("coverImage"));
  const startDate = parseDateInput(formData.get("startDate"));
  const endDate = parseDateInput(formData.get("endDate"));
  const articleIds = parseIdList(formData.get("articleIds"));
  const mediaIds = parseIdList(formData.get("mediaIds"));

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Event name is required.";
  if (!startDate) fieldErrors.startDate = "Event date is required.";
  if (startDate && endDate && endDate < startDate) fieldErrors.endDate = "End date is before the start date.";
  if (coverImage && !isHttpUrl(coverImage)) fieldErrors.coverImage = "Invalid image URL.";
  if (description.length > 5000) fieldErrors.description = "Description is too long.";
  if (Object.keys(fieldErrors).length) return { error: "Please fix the highlighted fields.", fieldErrors };

  const existing = id ? await db.event.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "This event no longer exists." };

  const slug = await uniqueSlug("event", str(formData.get("slug")) || title, existing?.id);
  const data = { title, slug, description, location, coverImage, startDate: startDate!, endDate };

  const event = existing
    ? await db.event.update({ where: { id: existing.id }, data })
    : await db.event.create({ data });

  // Sync associated articles and photographs.
  await db.article.updateMany({
    where: { eventId: event.id, id: { notIn: articleIds } },
    data: { eventId: null },
  });
  if (articleIds.length) {
    await db.article.updateMany({ where: { id: { in: articleIds } }, data: { eventId: event.id } });
  }
  await db.media.updateMany({
    where: { eventId: event.id, id: { notIn: mediaIds } },
    data: { eventId: null },
  });
  if (mediaIds.length) {
    await db.media.updateMany({ where: { id: { in: mediaIds } }, data: { eventId: event.id } });
  }

  revalidateSite();
  if (!existing) redirect(`/admin/events/${event.id}/edit?saved=1`);
  return { ok: true, message: "Event saved." };
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  await db.event.delete({ where: { id } }).catch(() => null);
  revalidateSite();
  if (formData.get("redirect") === "list") redirect("/admin/events?deleted=1");
}
