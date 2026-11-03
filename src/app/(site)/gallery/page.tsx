import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";

import { db } from "@/lib/db";
import { GALLERY_PARAM_KEYS, pickParams, type RawSearchParams } from "@/lib/params";
import { getGalleryMedia } from "@/lib/queries";
import { toGridItems } from "@/lib/gallery-items";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/site/empty-state";
import { FilterForm, filterLabelClass, filterSelectClass } from "@/components/site/filter-form";
import { Pagination } from "@/components/site/pagination";
import { PhotoGrid } from "@/components/site/photo-grid";
import { PageHeader } from "@/components/site/section-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs and video from events across Zimbabwe.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = pickParams(await searchParams, GALLERY_PARAM_KEYS);
  const [{ media, total, page, pageCount }, events, dates] = await Promise.all([
    getGalleryMedia(filters),
    db.event.findMany({ orderBy: { startDate: "desc" }, select: { title: true, slug: true } }),
    db.media.findMany({ select: { takenAt: true, createdAt: true } }),
  ]);
  const years = Array.from(
    new Set(dates.map((d) => (d.takenAt ?? d.createdAt).getUTCFullYear())),
  ).sort((a, b) => b - a);
  const hasFilters = Boolean(filters.event || filters.date || filters.year || filters.type);

  const typeTabs = [
    { value: "", label: "All" },
    { value: "image", label: "Photographs" },
    { value: "video", label: "Videos" },
  ];
  const tabHref = (type: string) => {
    const sp = new URLSearchParams();
    for (const k of ["event", "date", "year"] as const) if (filters[k]) sp.set(k, filters[k]!);
    if (type) sp.set("type", type);
    const qs = sp.toString();
    return qs ? `/gallery?${qs}` : "/gallery";
  };

  return (
    <>
      <PageHeader
        kicker="Media"
        title="Gallery"
        description="Photographs and video from the field. Select any image to view it full screen."
      />
      <div className="container-site">
        <div className="flex flex-col gap-5 border-b border-line py-6 lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Media type" className="flex gap-6">
            {typeTabs.map((t) => (
              <Link
                key={t.value}
                href={tabHref(t.value)}
                aria-current={(filters.type ?? "") === t.value ? "page" : undefined}
                className={cn(
                  "border-b-2 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em]",
                  (filters.type ?? "") === t.value ? "border-brand text-brand" : "border-transparent hover:text-brand",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <FilterForm action="/gallery" className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:w-[44rem]">
            <input type="hidden" name="type" value={filters.type ?? ""} />
            <label className="col-span-2">
              <span className={filterLabelClass}>Event</span>
              <select name="event" defaultValue={filters.event ?? ""} className={filterSelectClass}>
                <option value="">All events</option>
                {events.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={filterLabelClass}>Year</span>
              <select name="year" defaultValue={filters.year ?? ""} className={filterSelectClass}>
                <option value="">Any</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={filterLabelClass}>Date</span>
              <input type="date" name="date" defaultValue={filters.date} className={filterSelectClass} />
            </label>
          </FilterForm>
        </div>
        <div className="flex items-center justify-between py-5 text-sm text-muted">
          <span aria-live="polite">
            {total} {total === 1 ? "item" : "items"}
          </span>
          {hasFilters && (
            <Link href="/gallery" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-ink">
              <X className="size-4" /> Clear filters
            </Link>
          )}
        </div>
        {media.length ? (
          <PhotoGrid items={toGridItems(media)} />
        ) : (
          <EmptyState
            title="No media here yet."
            description={hasFilters ? "Try a different event, date or type." : undefined}
            href={hasFilters ? "/gallery" : undefined}
            linkLabel="Clear filters"
          />
        )}
        <Pagination basePath="/gallery" params={filters} page={page} pageCount={pageCount} />
      </div>
    </>
  );
}
