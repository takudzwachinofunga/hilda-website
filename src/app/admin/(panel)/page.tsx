import Link from "next/link";
import { CalendarDays, FilePen, FileText, Images, Plus } from "lucide-react";

import { db } from "@/lib/db";
import { formatDate, formatDateRange } from "@/lib/utils-text";
import { buttonVariants } from "@/components/ui/button";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";

export default async function DashboardPage() {
  const [published, drafts, events, photos, recentArticles, recentEvents] = await Promise.all([
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.event.count(),
    db.media.count({ where: { type: "IMAGE" } }),
    db.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, updatedAt: true, category: { select: { name: true } } },
    }),
    db.event.findMany({
      orderBy: { startDate: "desc" },
      take: 5,
      include: { _count: { select: { articles: true, media: true } } },
    }),
  ]);

  const stats = [
    { label: "Published articles", value: published, icon: FileText, href: "/admin/articles?status=PUBLISHED" },
    { label: "Draft articles", value: drafts, icon: FilePen, href: "/admin/articles?status=DRAFT" },
    { label: "Events", value: events, icon: CalendarDays, href: "/admin/events" },
    { label: "Photographs", value: photos, icon: Images, href: "/admin/media?type=IMAGE" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Your publication at a glance."
        actions={
          <>
            <Link href="/admin/events/new" className={buttonVariants({ variant: "outline" })}>
              <Plus className="size-4" /> New event
            </Link>
            <Link href="/admin/articles/new" className={buttonVariants()}>
              <Plus className="size-4" /> Write article
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Panel className="p-5 transition group-hover:border-ink/30">
              <s.icon className="size-5 text-brand" />
              <p className="mt-4 font-display text-4xl font-semibold tabular-nums">{s.value}</p>
              <p className="mt-1 text-[13px] text-muted">{s.label}</p>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Recent articles</h2>
            <Link href="/admin/articles" className="text-sm text-brand hover:underline">
              All articles
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No articles yet.{" "}
              <Link href="/admin/articles/new" className="text-brand underline">
                Write your first story
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recentArticles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/articles/${a.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-paper"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-[13px] text-muted">
                        {a.category?.name ?? "Uncategorised"} · Updated {formatDate(a.updatedAt, "short")}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Recent events</h2>
            <Link href="/admin/events" className="text-sm text-brand hover:underline">
              All events
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No events yet.{" "}
              <Link href="/admin/events/new" className="text-brand underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recentEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/events/${e.id}/edit`} className="block px-5 py-3.5 hover:bg-paper">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="text-[13px] text-muted">
                      {formatDateRange(e.startDate, e.endDate)} · {e._count.articles} articles · {e._count.media} media
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
