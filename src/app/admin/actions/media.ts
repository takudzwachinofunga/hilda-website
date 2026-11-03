"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cloudinaryThumbnail,
  deleteFromCloudinary,
  type UploadResourceType,
  verifyUpload,
} from "@/lib/cloudinary";
import { type ActionState, isHttpUrl, revalidateSite } from "@/lib/action-utils";
import { getVideoEmbed, getVideoThumbnail } from "@/lib/video";
import { optionalStr, parseDateInput, str } from "@/lib/utils-text";

export type MediaItemDTO = {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
};

function toDTO(m: {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
}): MediaItemDTO {
  return {
    id: m.id,
    type: m.type,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl,
    caption: m.caption,
    title: m.title,
    width: m.width,
    height: m.height,
  };
}

async function validEventId(eventId: string | null | undefined) {
  if (!eventId) return null;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  return event?.id ?? null;
}

/** Called after the browser finishes a signed upload. Verifies with Cloudinary before saving. */
export async function registerUpload(input: {
  publicId: string;
  resourceType: UploadResourceType;
  caption?: string;
  eventId?: string | null;
}): Promise<{ ok: true; media: MediaItemDTO } | { ok: false; error: string }> {
  await requireAdmin();
  if (input.resourceType !== "image" && input.resourceType !== "video") {
    return { ok: false, error: "Unsupported media type." };
  }
  try {
    const res = await verifyUpload(input.publicId, input.resourceType);
    const existing = await db.media.findFirst({ where: { publicId: res.public_id } });
    if (existing) return { ok: true, media: toDTO(existing) };
    const media = await db.media.create({
      data: {
        type: input.resourceType === "video" ? "VIDEO" : "IMAGE",
        url: res.secure_url,
        publicId: res.public_id,
        resourceType: res.resource_type,
        thumbnailUrl: cloudinaryThumbnail(res.secure_url, res.resource_type),
        width: res.width ?? null,
        height: res.height ?? null,
        bytes: res.bytes,
        format: res.format,
        caption: input.caption?.trim().slice(0, 500) || null,
        eventId: await validEventId(input.eventId),
      },
    });
    revalidateSite();
    return { ok: true, media: toDTO(media) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Upload verification failed." };
  }
}

/** Adds externally hosted media (YouTube/Vimeo video or an image URL). */
export async function addExternalMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const url = str(formData.get("url"));
  const type = str(formData.get("type")) === "VIDEO" ? "VIDEO" : "IMAGE";
  const caption = optionalStr(formData.get("caption"));
  const title = optionalStr(formData.get("title"));
  const thumbnail = optionalStr(formData.get("thumbnailUrl"));

  if (!isHttpUrl(url)) return { error: "Enter a valid URL.", fieldErrors: { url: "Invalid URL." } };
  if (type === "VIDEO" && !getVideoEmbed(url)) {
    return { error: "Unsupported video link. Use YouTube, Vimeo, Facebook, or a direct .mp4 URL." };
  }
  if (thumbnail && !isHttpUrl(thumbnail)) return { error: "Thumbnail must be a valid URL." };

  await db.media.create({
    data: {
      type,
      url,
      title,
      caption,
      thumbnailUrl: thumbnail ?? (type === "VIDEO" ? getVideoThumbnail(url) : url),
      eventId: await validEventId(optionalStr(formData.get("eventId"))),
      takenAt: parseDateInput(formData.get("takenAt")),
    },
  });
  revalidateSite();
  return { ok: true, message: type === "VIDEO" ? "Video added." : "Image added." };
}

export async function updateMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const existing = await db.media.findUnique({ where: { id } });
  if (!existing) return { error: "Media item not found." };

  const articleId = optionalStr(formData.get("articleId"));
  if (articleId && !(await db.article.findUnique({ where: { id: articleId }, select: { id: true } }))) {
    return { error: "Selected article no longer exists." };
  }
  const thumbnailUrl = optionalStr(formData.get("thumbnailUrl"));
  if (thumbnailUrl && !isHttpUrl(thumbnailUrl)) return { error: "Thumbnail must be a valid URL." };

  await db.media.update({
    where: { id },
    data: {
      title: optionalStr(formData.get("title")),
      caption: optionalStr(formData.get("caption"))?.slice(0, 500) ?? null,
      location: optionalStr(formData.get("location")),
      takenAt: parseDateInput(formData.get("takenAt")),
      eventId: await validEventId(optionalStr(formData.get("eventId"))),
      articleId,
      thumbnailUrl: thumbnailUrl ?? existing.thumbnailUrl,
    },
  });
  revalidateSite();
  return { ok: true, message: "Media updated." };
}

export async function deleteMedia(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;
  if (media.publicId) {
    await deleteFromCloudinary(media.publicId, media.resourceType ?? "image").catch((err) => {
      console.error("Cloudinary delete failed", err);
    });
  }
  // Clear any article/event fields that pointed directly at this asset.
  await db.article.updateMany({
    where: { featuredImage: media.url },
    data: { featuredImage: null, featuredImageCaption: null },
  });
  await db.event.updateMany({ where: { coverImage: media.url }, data: { coverImage: null } });
  await db.media.delete({ where: { id } });
  revalidateSite();
}

/** Lightweight list for the media picker dialog. */
export async function listMediaForPicker(input: { q?: string; type?: string; eventId?: string }) {
  await requireAdmin();
  const q = input.q?.trim();
  const items = await db.media.findMany({
    where: {
      ...(input.type === "IMAGE" || input.type === "VIDEO" ? { type: input.type } : {}),
      ...(input.eventId ? { eventId: input.eventId } : {}),
      ...(q
        ? {
            OR: [
              { caption: { contains: q } },
              { title: { contains: q } },
              { event: { title: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  return items.map(toDTO);
}
