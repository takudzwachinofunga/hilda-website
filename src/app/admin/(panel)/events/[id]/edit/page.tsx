import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { mediaDTO } from "@/lib/admin-data";
import { toDateInput } from "@/lib/utils-text";
import { deleteEvent } from "@/app/admin/actions/events";
import { EventForm } from "@/components/admin/event-form";
import { ConfirmAction } from "@/components/admin/ui";
import { SavedNotice } from "@/components/admin/saved-notice";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const [event, allArticles] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: {
        articles: { orderBy: { publishedAt: "desc" }, select: { id: true, title: true } },
        media: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.article.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, eventId: true } }),
  ]);
  if (!event) notFound();

  return (
    <>
      <SavedNotice message={saved ? "Event created." : undefined} />
      <EventForm
        allArticles={allArticles}
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          location: event.location ?? "",
          startDate: toDateInput(event.startDate),
          endDate: toDateInput(event.endDate),
          coverImage: event.coverImage,
          articles: event.articles,
          media: event.media.map(mediaDTO),
        }}
      />
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm">
        <Link href={`/events/${event.slug}`} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
          View event page <ExternalLink className="size-3" />
        </Link>
        <ConfirmAction
          action={deleteEvent}
          fields={{ id: event.id, redirect: "list" }}
          title="Delete this event?"
          description="Articles and media stay in place but are no longer linked to this event."
          variant="outline"
          className="text-brand"
        >
          <Trash2 className="size-4" /> Delete event
        </ConfirmAction>
      </div>
    </>
  );
}
