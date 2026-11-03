// Custom next/image loader. Cloudinary URLs get on-the-fly resizing and format
// negotiation from Cloudinary's CDN; Wikimedia Commons URLs are rewritten to one
// of Wikimedia's permitted thumbnail widths. Anything else is served as-is.
import { resizedImageSrc } from "./image-sources";

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const resized = resizedImageSrc(src, width, quality);
  if (resized) return resized;
  // Fragment keeps the URL unchanged for the server while satisfying next/image's
  // requirement that loaders vary by width.
  return `${src}#w=${width}`;
}
