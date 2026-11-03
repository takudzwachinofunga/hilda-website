import type { PhotoGridItem } from "@/components/site/photo-grid";
import { formatDate } from "@/lib/utils-text";
import { getVideoEmbed } from "@/lib/video";

type MediaLike = {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
  takenAt?: Date | null;
  location?: string | null;
  createdAt: Date;
  event?: { title: string; slug: string; startDate: Date; location: string | null } | null;
  article?: { title: string; slug: string } | null;
};

/** Maps database media rows to serialisable items for the client photo grid + lightbox. */
export function toGridItems(media: MediaLike[]): PhotoGridItem[] {
  return media.map((m) => ({
    id: m.id,
    type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
    src: m.url,
    thumb: m.thumbnailUrl ?? (m.type === "IMAGE" ? m.url : null),
    width: m.width,
    height: m.height,
    caption: m.caption,
    title: m.title,
    eventTitle: m.event?.title ?? null,
    eventHref: m.event ? `/events/${m.event.slug}` : null,
    articleTitle: m.article?.title ?? null,
    articleHref: m.article ? `/news/${m.article.slug}` : null,
    date: formatDate(m.takenAt ?? m.event?.startDate ?? m.createdAt),
    location: m.location ?? m.event?.location ?? null,
    embed: m.type === "VIDEO" ? getVideoEmbed(m.url) : null,
  }));
}
