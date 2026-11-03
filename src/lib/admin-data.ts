import "server-only";

import { db } from "@/lib/db";
import { toDateInput } from "@/lib/utils-text";

/** Options shared by the article editor. */
export async function getArticleFormOptions() {
  const [categories, events] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.event.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, startDate: true, location: true },
    }),
  ]);
  return {
    categories,
    events: events.map((e) => ({ ...e, startDate: toDateInput(e.startDate) })),
  };
}

export function mediaDTO(m: {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
}) {
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
