export type VideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string; poster?: string };

/** Turns a YouTube / Vimeo / Cloudinary / direct video URL into something embeddable. */
export function getVideoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id =
      u.searchParams.get("v") ??
      u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{5,})/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host === "facebook.com" || host === "fb.watch") {
    return {
      kind: "iframe",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
    };
  }
  if (host === "res.cloudinary.com" && u.pathname.includes("/video/upload/")) {
    const poster = url.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, ".jpg");
    return { kind: "file", src: url, poster };
  }
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(u.pathname)) return { kind: "file", src: url };
  return null;
}

/** Best-effort thumbnail for external videos (YouTube only; others need an uploaded poster). */
export function getVideoThumbnail(url: string | null | undefined) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;
  if (embed.kind === "file") return embed.poster ?? null;
  const yt = embed.src.match(/youtube-nocookie\.com\/embed\/([\w-]+)/)?.[1];
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null;
}
