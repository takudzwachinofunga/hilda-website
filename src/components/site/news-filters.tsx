import Link from "next/link";
import { X } from "lucide-react";

import type { NewsFilters as Filters } from "@/lib/queries";
import { FilterForm, SearchField, filterLabelClass, filterSelectClass } from "@/components/site/filter-form";

type Options = {
  categories: { name: string; slug: string }[];
  events: { title: string; slug: string }[];
  years: number[];
};

export function NewsFilters({
  action,
  filters,
  options,
  showSearch = true,
}: {
  action: string;
  filters: Filters;
  options: Options;
  showSearch?: boolean;
}) {
  const active = (["q", "event", "category", "date", "from", "to", "year", "featured"] as const).filter(
    (k) => filters[k],
  );

  return (
    <FilterForm action={action} className="space-y-4">
      {showSearch ? <SearchField defaultValue={filters.q} /> : <input type="hidden" name="q" value={filters.q ?? ""} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <label className="col-span-2 lg:col-span-2">
          <span className={filterLabelClass}>Event</span>
          <select name="event" defaultValue={filters.event ?? ""} className={filterSelectClass}>
            <option value="">All events</option>
            {options.events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 md:col-span-1 lg:col-span-1">
          <span className={filterLabelClass}>Category</span>
          <select name="category" defaultValue={filters.category ?? ""} className={filterSelectClass}>
            <option value="">All</option>
            {options.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={filterLabelClass}>Year</span>
          <select name="year" defaultValue={filters.year ?? ""} className={filterSelectClass}>
            <option value="">Any</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={filterLabelClass}>On date</span>
          <input type="date" name="date" defaultValue={filters.date} className={filterSelectClass} />
        </label>
        <label>
          <span className={filterLabelClass}>From</span>
          <input type="date" name="from" defaultValue={filters.from} className={filterSelectClass} />
        </label>
        <label>
          <span className={filterLabelClass}>To</span>
          <input type="date" name="to" defaultValue={filters.to} className={filterSelectClass} />
        </label>
        <label>
          <span className={filterLabelClass}>Sort</span>
          <select name="sort" defaultValue={filters.sort ?? ""} className={filterSelectClass}>
            <option value="">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            value="1"
            defaultChecked={filters.featured === "1"}
            className="size-4 accent-[#C8102E]"
          />
          Featured articles only
        </label>
        <div className="flex items-center gap-4">
          <noscript>
            <button type="submit" className="bg-ink px-4 py-2 text-sm text-white">
              Apply
            </button>
          </noscript>
          {active.length > 0 && (
            <Link
              href={action}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-brand hover:text-ink"
            >
              <X className="size-4" /> Clear filters
            </Link>
          )}
        </div>
      </div>
    </FilterForm>
  );
}
