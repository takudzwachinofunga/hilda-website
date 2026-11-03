import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { param, type RawSearchParams } from "@/lib/params";
import { formatDateRange } from "@/lib/utils-text";
import { deleteEvent } from "@/app/admin/actions/events";
import { buttonVariants } from "@/components/ui/button";
import { FilterForm } from "@/components/site/filter-form";
import { AdminPageHeader, ConfirmAction, Panel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Events" };

export default async function EventsAdminPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const q = param(await searchParams, "q");
  const events = await db.event.findMany({
    where: q ? { OR: [{ title: { contains: q } }, { location: { contains: q } }] } : undefined,
    orderBy: { startDate: "desc" },
    include: { _count: { select: { articles: true, media: true } } },
  });

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Engagements you have covered. Articles and photographs can be grouped under each event."
        actions={
          <Link href="/admin/events/new" className={buttonVariants()}>
            <Plus className="size-4" /> New event
          </Link>
        }
      />
      <Panel className="mb-4 p-3">
        <FilterForm action="/admin/events">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search events or locations…"
            className="h-9 w-full rounded-md border border-input px-3 text-sm outline-none focus:border-ink"
          />
        </FilterForm>
      </Panel>

      {events.length === 0 ? (
        <Panel className="px-6 py-16 text-center">
          <p className="font-display text-2xl">No events yet.</p>
          <Link href="/admin/events/new" className="mt-2 inline-block text-sm text-brand underline">
            Create your first event
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <Panel key={e.id} className="flex flex-col overflow-hidden">
              <Link href={`/admin/events/${e.id}/edit`} className="block aspect-[16/9] bg-paper">
                {e.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img src={e.coverImage} alt="" className="size-full object-cover" loading="lazy" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-brand">
                  {formatDateRange(e.startDate, e.endDate)}
                </p>
                <Link href={`/admin/events/${e.id}/edit`} className="mt-1 font-display text-xl font-semibold leading-tight hover:text-brand">
                  {e.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{e.location ?? "No location"}</p>
                <p className="mt-2 text-[13px] text-muted">
                  {e._count.articles} articles · {e._count.media} media
                </p>
                <div className="mt-auto flex items-center gap-1 pt-4">
                  <Link href={`/admin/events/${e.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Pencil className="size-3.5" /> Edit
                  </Link>
                  <Link
                    href={`/events/${e.slug}`}
                    target="_blank"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <ExternalLink className="size-3.5" /> View
                  </Link>
                  <ConfirmAction
                    action={deleteEvent}
                    fields={{ id: e.id }}
                    title="Delete this event?"
                    description="Articles and media linked to it are kept but will no longer be associated with an event."
                    variant="ghost"
                    className="ml-auto text-muted hover:text-brand"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </ConfirmAction>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
