import type { Metadata } from "next";

import { NEWS_PARAM_KEYS, pickParams, type RawSearchParams } from "@/lib/params";
import { getFilterOptions, searchArticles, type NewsFilters as Filters } from "@/lib/queries";
import { EditorialGrid } from "@/components/site/editorial-grid";
import { EmptyState } from "@/components/site/empty-state";
import { NewsFilters } from "@/components/site/news-filters";
import { Pagination } from "@/components/site/pagination";
import { PageHeader } from "@/components/site/section-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "All published reports, searchable by event, category, date and place.",
  alternates: { canonical: "/news" },
};

type SearchParams = Promise<RawSearchParams>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters: Filters = pickParams(await searchParams, NEWS_PARAM_KEYS);
  const [{ articles, total, page, pageCount }, options] = await Promise.all([
    searchArticles(filters),
    getFilterOptions(),
  ]);
  const filtered = Object.entries(filters).some(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <>
      <PageHeader
        kicker="Archive"
        title="News"
        description="Every report filed from the field — searchable by event, category, date and place."
      />
      <div className="container-site">
        <div className="border-b border-line py-6">
          <NewsFilters action="/news" filters={filters} options={options} />
        </div>
        <p className="py-6 text-sm text-muted" aria-live="polite">
          {total === 0
            ? "No articles found"
            : `${total} ${total === 1 ? "article" : "articles"}${filtered ? (total === 1 ? " matches your filters" : " match your filters") : ""}`}
          {pageCount > 1 && ` · Page ${page} of ${pageCount}`}
        </p>
        {articles.length ? (
          <EditorialGrid articles={articles} priorityFirst />
        ) : (
          <EmptyState
            title="Nothing matches those filters."
            description="Try a different search term, widen the date range, or clear the filters."
            href="/news"
            linkLabel="Clear filters"
          />
        )}
        <Pagination
          basePath="/news"
          params={filters}
          page={page}
          pageCount={pageCount}
        />
      </div>
    </>
  );
}
