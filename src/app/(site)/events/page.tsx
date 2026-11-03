import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { db } from "@/lib/db";
import { param, type RawSearchParams } from "@/lib/params";
import { getEvents } from "@/lib/queries";
import { formatDateRange, truncate } from "@/lib/utils-text";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/site/empty-state";
import { FilterForm, SearchField, filterSelectClass } from "@/components/site/filter-form";
import { MediaImage } from "@/components/site/media-image";
import { PageHeader } from "@/components/site/section-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "An archive of the events, engagements and visits covered on assignment.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const q = param(sp, "q");
  const year = param(sp, "year");
  const [events, allDates] = await Promise.all([
    getEvents({ q, year }),
    db.event.findMany({ select: { startDate: true }, orderBy: { startDate: "desc" } }),
  ]);
  const years = Array.from(new Set(allDates.map((e) => e.startDate.getUTCFullYear())));

  // Group by year for an archive feel.
  const groups = new Map<number, typeof events>();
  for (const e of events) {
    const y = e.startDate.getUTCFullYear();
    groups.set(y, [...(groups.get(y) ?? []), e]);
  }

  return (
    <>
      <PageHeader
        kicker="Archive"
        title="Events"
        description="Engagements, visits, launches and gatherings — each with its reports, photographs and video."
      />
      <div className="container-site">
        <FilterForm action="/events" className="grid gap-3 border-b border-line py-6 md:grid-cols-[1fr_12rem]">
          <SearchField defaultValue={q} placeholder="Search events or places…" />
          <label>
            <span className="sr-only">Year</span>
            <select name="year" defaultValue={year ?? ""} className={filterSelectClass}>
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </FilterForm>

        {events.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No events found."
              description={q || year ? "Try another search or year." : "Events will appear here once added."}
              href={q || year ? "/events" : undefined}
              linkLabel="Show all events"
            />
          </div>
        ) : (
          Array.from(groups).map(([y, list]) => (
            <section key={y} className="mt-14">
              <div className="mb-8 flex items-baseline gap-4">
                <h2 className="font-display text-6xl font-semibold text-brand md:text-7xl">{y}</h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-sm text-muted">
                  {list.length} {list.length === 1 ? "event" : "events"}
                </span>
              </div>
              <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-6">
                {list.map((event, i) => {
                  // Asymmetric rhythm: wide/narrow pairs that alternate each row.
                  const wide = i % 4 === 0 || i % 4 === 3;
                  return (
                    <article
                      key={event.id}
                      className={cn("group", wide ? "lg:col-span-4" : "lg:col-span-2")}
                    >
                      <Link href={`/events/${event.slug}`} className="block">
                        <MediaImage
                          src={event.coverImage}
                          alt={event.title}
                          sizes={wide ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                          className={wide ? "aspect-[16/9]" : "aspect-[4/5] lg:aspect-[4/5]"}
                          imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        <p className="kicker mt-5 text-brand">{formatDateRange(event.startDate, event.endDate)}</p>
                        <h3 className="headline mt-2 text-3xl leading-tight group-hover:text-brand">{event.title}</h3>
                        {event.location && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                            <MapPin className="size-4" /> {event.location}
                          </p>
                        )}
                        {event.description && wide && (
                          <p className="mt-3 max-w-2xl font-serif text-[17px] leading-relaxed text-ink/80">
                            {truncate(event.description, 220)}
                          </p>
                        )}
                        <p className="mt-3 text-[13px] text-muted">
                          {event._count.articles} {event._count.articles === 1 ? "article" : "articles"} ·{" "}
                          {event._count.media} photos &amp; videos
                        </p>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
