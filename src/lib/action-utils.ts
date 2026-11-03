import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils-text";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

/** Invalidate all public and admin pages after content changes. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

type SlugModel = "article" | "event" | "category";

/** Returns a unique slug for the given model, appending -2, -3… when needed. */
export async function uniqueSlug(model: SlugModel, desired: string, excludeId?: string) {
  const base = slugify(desired);
  let candidate = base;
  for (let i = 2; i < 500; i++) {
    const where = { slug: candidate };
    const existing =
      model === "article"
        ? await db.article.findUnique({ where, select: { id: true } })
        : model === "event"
          ? await db.event.findUnique({ where, select: { id: true } })
          : await db.category.findUnique({ where, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
