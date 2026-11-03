import "server-only";

import { v2 as cloudinary } from "cloudinary";

export const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER || "journalist-site";

export const UPLOAD_RULES = {
  image: {
    formats: ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic"],
    maxBytes: 10 * 1024 * 1024, // Cloudinary Free image limit
  },
  video: {
    formats: ["mp4", "mov", "webm", "m4v"],
    maxBytes: 100 * 1024 * 1024, // Cloudinary Free video limit
  },
} as const;

export type UploadResourceType = keyof typeof UPLOAD_RULES;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* environment variables.");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/** Creates a short-lived signature so the browser can upload directly to Cloudinary. */
export function createUploadSignature(resourceType: UploadResourceType) {
  const c = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: UPLOAD_FOLDER,
    allowed_formats: UPLOAD_RULES[resourceType].formats.join(","),
  };
  const signature = c.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    maxBytes: UPLOAD_RULES[resourceType].maxBytes,
  };
}

type VerifiedResource = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
};

/**
 * Verifies an upload server-side using the Admin API: it must exist, live in our
 * folder, and respect format/size rules. Invalid uploads are deleted.
 */
export async function verifyUpload(publicId: string, resourceType: UploadResourceType) {
  const c = configure();
  if (!publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
    throw new Error("Upload is outside the permitted folder.");
  }
  const res = (await c.api.resource(publicId, { resource_type: resourceType })) as VerifiedResource;
  const rules = UPLOAD_RULES[resourceType];
  const formatOk = (rules.formats as readonly string[]).includes(res.format?.toLowerCase());
  if (!formatOk || res.bytes > rules.maxBytes) {
    await c.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    throw new Error(
      !formatOk ? `File type .${res.format} is not allowed.` : "File exceeds the maximum size.",
    );
  }
  return res;
}

export async function deleteFromCloudinary(publicId: string, resourceType: string) {
  if (!isCloudinaryConfigured()) return;
  const c = configure();
  await c.uploader.destroy(publicId, {
    resource_type: resourceType === "video" ? "video" : "image",
    invalidate: true,
  });
}

/** Thumbnail URL for a Cloudinary asset. */
export function cloudinaryThumbnail(secureUrl: string, resourceType: string) {
  if (resourceType === "video") {
    return secureUrl
      .replace("/video/upload/", "/video/upload/so_auto,w_800,c_limit/")
      .replace(/\.[a-z0-9]+$/i, ".jpg");
  }
  return secureUrl.replace("/image/upload/", "/image/upload/w_600,c_limit,f_auto,q_auto/");
}
