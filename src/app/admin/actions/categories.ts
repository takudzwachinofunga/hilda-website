"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ActionState, revalidateSite, uniqueSlug } from "@/lib/action-utils";
import { optionalStr, str } from "@/lib/utils-text";

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = optionalStr(formData.get("id"));
  const name = str(formData.get("name"));
  const description = optionalStr(formData.get("description"));
  if (!name) return { error: "Category name is required.", fieldErrors: { name: "Required." } };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };

  const clash = await db.category.findFirst({ where: { name, NOT: id ? { id } : undefined } });
  if (clash) return { error: `A category called “${name}” already exists.` };

  const slug = await uniqueSlug("category", str(formData.get("slug")) || name, id ?? undefined);
  if (id) {
    await db.category.update({ where: { id }, data: { name, slug, description } });
  } else {
    await db.category.create({ data: { name, slug, description } });
  }
  revalidateSite();
  return { ok: true, message: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  // Articles keep existing; their category is cleared (onDelete: SetNull).
  await db.category.delete({ where: { id } }).catch(() => null);
  revalidateSite();
}
