import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { param, type RawSearchParams } from "@/lib/params";
import { formatDate } from "@/lib/utils-text";
import { cn } from "@/lib/utils";
import { deleteArticle, setArticleStatus, toggleFeatured } from "@/app/admin/actions/articles";
import { buttonVariants } from "@/components/ui/button";
import { FilterForm } from "@/components/site/filter-form";
import { AdminPageHeader, ConfirmAction, Panel, StatusBadge, nativeSelectClass } from "@/components/admin/ui";
import { Pagination } from "@/components/site/pagination";

export const metadata: Metadata = { title: "Articles" };

const PAGE_SIZE = 20;

const SORTS: Record<string, Prisma.ArticleOrderByWithRelationInput> = {
  updated: { updatedAt: "desc" },
  created: { createdAt: "desc" },
  published: { publishedAt: "desc" },
  oldest: { createdAt: "asc" },
  title: { title: "asc" },
};

export default async function ArticlesAdminPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status");
  const category = param(sp, "category");
  const event = param(sp, "event");
  const featured = param(sp, "featured");
  const sort = param(sp, "sort") ?? "updated";
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);

  const where: Prisma.ArticleWhereInput = {
    ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { slug: { contains: q } }] } : {}),
    ...(status === "PUBLISHED" || status === "DRAFT" ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(event ? { eventId: event } : {}),
    ...(featured === "1" ? { isFeatured: true } : {}),
  };

  const [total, articles, categories, events] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: SORTS[sort] ?? SORTS.updated,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        event: { select: { title: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, title: true } }),
  ]);

  const now = new Date();
  const params = { q, status, category, event, featured, sort: sort === "updated" ? undefined : sort };

  return (
    <>
      <AdminPageHeader
        title="Articles"
        description={`${total} ${total === 1 ? "article" : "articles"}`}
        actions={
          <Link href="/admin/articles/new" className={buttonVariants()}>
            <Plus className="size-4" /> New article
          </Link>
        }
      />

      <Panel className="mb-4 p-3">
        <FilterForm action="/admin/articles" className="grid gap-2 md:grid-cols-[1fr_repeat(5,minmax(0,9rem))]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="h-9 rounded-md border border-input px-3 text-sm outline-none focus:border-ink"
          />
          <select name="status" defaultValue={status ?? ""} className={nativeSelectClass} aria-label="Status">
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts</option>
          </select>
          <select name="category" defaultValue={category ?? ""} className={nativeSelectClass} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="event" defaultValue={event ?? ""} className={nativeSelectClass} aria-label="Event">
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <select name="featured" defaultValue={featured ?? ""} className={nativeSelectClass} aria-label="Featured">
            <option value="">Any</option>
            <option value="1">Featured only</option>
          </select>
          <select name="sort" defaultValue={sort} className={nativeSelectClass} aria-label="Sort">
            <option value="updated">Recently updated</option>
            <option value="created">Newest created</option>
            <option value="published">Recently published</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </FilterForm>
      </Panel>

      <Panel className="overflow-hidden">
        {articles.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-2xl">No articles found.</p>
            <p className="mt-2 text-sm text-muted">
              {q || status || category || event || featured ? (
                <Link href="/admin/articles" className="text-brand underline">
                  Clear filters
                </Link>
              ) : (
                <Link href="/admin/articles/new" className="text-brand underline">
                  Write your first article
                </Link>
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="border-b border-line bg-paper/60 text-left text-[12px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="w-20 px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {articles.map((a) => (
                  <tr key={a.id} className="align-middle hover:bg-paper/50">
                    <td className="px-4 py-3">
                      <div className="h-12 w-16 overflow-hidden rounded bg-paper">
                        {a.featuredImage && (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img src={a.featuredImage} alt="" className="size-full object-cover" loading="lazy" />
                        )}
                      </div>
                    </td>
                    <td className="max-w-[22rem] px-4 py-3">
                      <Link href={`/admin/articles/${a.id}/edit`} className="line-clamp-2 font-medium hover:text-brand">
                        {a.title}
                      </Link>
                      <span className="text-[12px] text-muted">/{a.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{a.category?.name ?? "—"}</td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-muted">{a.event?.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <form action={setArticleStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value={a.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                        <button
                          type="submit"
                          title={a.status === "PUBLISHED" ? "Click to unpublish" : "Click to publish"}
                        >
                          <StatusBadge status={a.status} scheduled={Boolean(a.publishedAt && a.publishedAt > now)} />
                        </button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(a.createdAt, "short")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {a.publishedAt && a.status === "PUBLISHED" ? formatDate(a.publishedAt, "short") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <form action={toggleFeatured}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            type="submit"
                            title={a.isFeatured ? "Remove from featured" : "Mark as featured"}
                            aria-label={a.isFeatured ? "Remove from featured" : "Mark as featured"}
                            className={cn(
                              "inline-flex size-8 items-center justify-center rounded hover:bg-paper",
                              a.isFeatured ? "text-brand" : "text-muted",
                            )}
                          >
                            <Star className={cn("size-4", a.isFeatured && "fill-current")} />
                          </button>
                        </form>
                        <Link
                          href={`/admin/preview/${a.id}`}
                          title="Preview"
                          aria-label="Preview"
                          className="inline-flex size-8 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <Link
                          href={`/admin/articles/${a.id}/edit`}
                          title="Edit"
                          aria-label="Edit"
                          className="inline-flex size-8 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <ConfirmAction
                          action={deleteArticle}
                          fields={{ id: a.id }}
                          title="Delete this article?"
                          description={`“${a.title}” will be permanently deleted. Photos in the media library are kept.`}
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted hover:text-brand"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </ConfirmAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Pagination
        basePath="/admin/articles"
        params={params}
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      />
    </>
  );
}
