import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { param, type RawSearchParams } from "@/lib/params";
import { toDateInput } from "@/lib/utils-text";
import { FilterForm } from "@/components/site/filter-form";
import { AdminPageHeader, Panel, nativeSelectClass } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { Pagination } from "@/components/site/pagination";

export const metadata: Metadata = { title: "Media Library" };

const PAGE_SIZE = 48;

export default async function MediaAdminPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const q = param(sp, "q");
  const event = param(sp, "event");
  const type = param(sp, "type");
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);

  const where: Prisma.MediaWhereInput = {
    ...(type === "IMAGE" || type === "VIDEO" ? { type } : {}),
    ...(event === "none" ? { eventId: null } : event ? { eventId: event } : {}),
    ...(q
      ? {
          OR: [
            { caption: { contains: q } },
            { title: { contains: q } },
            { location: { contains: q } },
            { event: { title: { contains: q } } },
            { article: { title: { contains: q } } },
          ],
        }
      : {}),
  };

  const [total, media, events, articles] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        event: { select: { id: true, title: true } },
        article: { select: { id: true, title: true } },
      },
    }),
    db.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, title: true } }),
    db.article.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Media Library" description={`${total} items · photographs and videos`} />

      <Panel className="mb-4 p-3">
        <FilterForm action="/admin/media" className="grid gap-2 md:grid-cols-[1fr_14rem_10rem]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search captions, events, articles…"
            className="h-9 rounded-md border border-input px-3 text-sm outline-none focus:border-ink"
          />
          <select name="event" defaultValue={event ?? ""} className={nativeSelectClass} aria-label="Event">
            <option value="">All events</option>
            <option value="none">Not assigned to an event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={type ?? ""} className={nativeSelectClass} aria-label="Media type">
            <option value="">All types</option>
            <option value="IMAGE">Photographs</option>
            <option value="VIDEO">Videos</option>
          </select>
        </FilterForm>
      </Panel>

      <MediaLibrary
        cloudinaryReady={isCloudinaryConfigured()}
        events={events}
        articles={articles}
        defaultEventId={event && event !== "none" ? event : null}
        items={media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          title: m.title,
          caption: m.caption,
          location: m.location,
          takenAt: toDateInput(m.takenAt),
          eventId: m.eventId,
          eventTitle: m.event?.title ?? null,
          articleId: m.articleId,
          articleTitle: m.article?.title ?? null,
          publicId: m.publicId,
          width: m.width,
          height: m.height,
          bytes: m.bytes,
          format: m.format,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
      <Pagination
        basePath="/admin/media"
        params={{ q, event, type }}
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      />
    </>
  );
}
