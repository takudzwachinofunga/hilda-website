"use server";

import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ActionState, isHttpUrl, revalidateSite } from "@/lib/action-utils";
import { optionalStr, str } from "@/lib/utils-text";

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const siteName = str(formData.get("siteName"));
  const authorName = str(formData.get("authorName"));
  if (!siteName) return { error: "Site name is required.", fieldErrors: { siteName: "Required." } };
  if (!authorName) return { error: "Author name is required.", fieldErrors: { authorName: "Required." } };

  const urls = ["authorPhoto", "twitterUrl", "facebookUrl", "instagramUrl", "youtubeUrl", "linkedinUrl"] as const;
  const urlValues: Record<string, string | null> = {};
  const fieldErrors: Record<string, string> = {};
  for (const key of urls) {
    const v = optionalStr(formData.get(key));
    if (v && !isHttpUrl(v)) fieldErrors[key] = "Enter a full URL starting with https://";
    urlValues[key] = v;
  }
  if (Object.keys(fieldErrors).length) return { error: "Please fix the highlighted fields.", fieldErrors };

  const data = {
    siteName,
    authorName,
    tagline: str(formData.get("tagline")),
    authorBio: str(formData.get("authorBio")),
    contactEmail: optionalStr(formData.get("contactEmail")),
    location: optionalStr(formData.get("location")),
    ...urlValues,
  };
  await db.setting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  revalidateSite();
  return { ok: true, message: "Settings saved." };
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const current = str(formData.get("currentPassword"));
  const next = str(formData.get("newPassword"));
  const confirm = str(formData.get("confirmPassword"));
  if (next.length < 10) return { error: "New password must be at least 10 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };

  const record = await db.admin.findUnique({ where: { id: admin.id } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: true, message: "Password updated." };
}
