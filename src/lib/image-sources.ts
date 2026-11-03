/**
 * URL rewriting for the external image hosts this site serves pictures from.
 *
 * Client-safe: imported by the custom next/image loader and by the lightbox,
 * which shows full-resolution images outside next/image.
 */

export const CLOUDINARY_UPLOAD = "/image/upload/";

export const COMMONS_PREFIX = "https://upload.wikimedia.org/wikipedia/commons/";

/**
 * Wikimedia's image servers only render this fixed set of thumbnail widths and
 * reject any other size outright, so a request has to be rounded up to one of
 * them. See https://www.mediawiki.org/wiki/Common_thumbnail_sizes
 */
export const COMMONS_WIDTHS = [120, 250, 330, 500, 960, 1280, 1920] as const;

const COMMONS_STILL = /\.(jpe?g|png|gif|tiff?|webp)$/i;
/** e.g. "thumb/6/62/Name.jpg/500px-Name.jpg" → "6/62/Name.jpg" */
const COMMONS_THUMB = /^thumb\/(.+?)\/\d+px-[^/]+$/;

/**
 * Rewrites a Wikimedia Commons file URL to the smallest permitted thumbnail that
 * still covers `width`. Returns null for anything that is not a Commons still
 * image (videos and audio have no thumbnail at this path).
 *
 * URLs that are already thumbnails are normalised back to the source file first,
 * so a stored thumbnail never pins an image to the size it happened to be saved at.
 */
export function commonsThumbnail(src: string, width: number): string | null {
  if (!src.startsWith(COMMONS_PREFIX)) return null;
  const path = src.slice(COMMONS_PREFIX.length).replace(COMMONS_THUMB, "$1");
  const name = path.slice(path.lastIndexOf("/") + 1);
  if (!COMMONS_STILL.test(name)) return null;
  const step = COMMONS_WIDTHS.find((w) => w >= width) ?? COMMONS_WIDTHS[COMMONS_WIDTHS.length - 1];
  return `${COMMONS_PREFIX}thumb/${path}/${step}px-${name}`;
}

/** Cloudinary resizes and negotiates format on its own CDN. */
export function cloudinaryResized(src: string, width: number, quality?: number): string | null {
  if (!src.includes("res.cloudinary.com") || !src.includes(CLOUDINARY_UPLOAD)) return null;
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace(CLOUDINARY_UPLOAD, `${CLOUDINARY_UPLOAD}f_auto,${q},c_limit,w_${width}/`);
}

/**
 * Best URL for showing `src` at roughly `width` CSS pixels, or null when the host
 * cannot resize and the original has to be served as-is.
 */
export function resizedImageSrc(src: string, width: number, quality?: number): string | null {
  return cloudinaryResized(src, width, quality) ?? commonsThumbnail(src, width);
}
