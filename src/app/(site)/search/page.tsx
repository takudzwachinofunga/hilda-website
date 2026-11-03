import type { Metadata } from "next";
import Link from "next/link";

import { NEWS_PARAM_KEYS, pickParams, type RawSearchParams } from "@/lib/params";
import { getEvents, getFilterOptions, searchArticles, type NewsFilters as Filters } from "@/lib/queries";
import { formatDateRange } from "@/lib/utils-text";
import { CompactCard } from "@/components/site/article-cards";
import { EmptyState } from "@/components/site/empty-state";
import { FilterForm, SearchField } from "@/components/site/filter-form";
import { NewsFilters } from "@/components/site/news-filters";
import { Pagination } from "@/components/site/pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search all reports, events, places and tags.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters: Filters = pickParams(await searchParams, NEWS_PARAM_KEYS);
  const q = filters.q?.trim();
  const [results, events, options] = await Promise.all([
    q ? searchArticles(filters) : null,
    q && !filters.page ? getEvents({ q }) : Promise.resolve([]),
    getFilterOptions(),
  ]);

  return (
    <div className="container-site pb-10 pt-12 md:pt-20">
      <p className="kicker text-brand">Search</p>
      <FilterForm action="/search" className="mt-4">
        <SearchField large defaultValue={q} autoFocus={!q} placeholder="What are you looking for?" />
      </FilterForm>

      {!q ? (
        <div className="mt-12">
          <h2 className="kicker text-muted">Browse by topic</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {options.categories.map((c) => (
              <Link
                key={c.slug}
                href={`/news?category=${c.slug}`}
                className="border border-line px-4 py-2 text-[15px] transition hover:border-brand hover:text-brand"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 border-b border-line pb-6">
            <NewsFilters action="/search" filters={filters} options={options} showSearch={false} />
          </div>

          {events.length > 0 && (
            <section className="mt-10">
              <h2 className="kicker text-muted">Matching events</h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {events.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="block border border-line p-4 transition hover:border-brand">
                      <span className="kicker text-brand">{formatDateRange(e.startDate, e.endDate)}</span>
                      <span className="headline mt-1 block text-xl">{e.title}</span>
                      {e.location && <span className="mt-1 block text-sm text-muted">{e.location}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="kicker text-muted" aria-live="polite">
              {results?.total ?? 0} {results?.total === 1 ? "article" : "articles"} for “{q}”
            </h2>
            {results && results.articles.length > 0 ? (
              <div className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
                {results.articles.map((a) => (
                  <CompactCard key={a.id} article={a} className="border-b border-line pb-8" />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No articles found."
                  description="Check the spelling, try a broader term, or search by place or event name."
                />
              </div>
            )}
            {results && (
              <Pagination basePath="/search" params={filters} page={results.page} pageCount={results.pageCount} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
