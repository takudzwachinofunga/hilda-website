import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import {
  getFeaturedArticle,
  getLatestArticles,
  getPhotoHighlights,
  getRecentEvents,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatDate, formatDateRange } from "@/lib/utils-text";
import { toGridItems } from "@/lib/gallery-items";
import { ArticleMeta, CategoryLabel } from "@/components/site/article-cards";
import { EditorialGrid } from "@/components/site/editorial-grid";
import { MediaImage } from "@/components/site/media-image";
import { PhotoGrid } from "@/components/site/photo-grid";
import { SectionHeading } from "@/components/site/section-heading";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, settings] = await Promise.all([getFeaturedArticle(), getSettings()]);

  if (!featured) {
    return (
      <div className="container-site py-28 text-center">
        <p className="kicker text-brand">{settings.siteName}</p>
        <h1 className="headline mx-auto mt-4 max-w-3xl text-5xl md:text-6xl">
          The first story is on its way.
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-muted">{settings.tagline}</p>
      </div>
    );
  }

  const latest = await getLatestArticles(4, [featured.id]);
  const [gridArticles, events, photos] = await Promise.all([
    getLatestArticles(10, [featured.id, ...latest.map((a) => a.id)]),
    getRecentEvents(4),
    getPhotoHighlights(7),
  ]);

  return (
    <>
      {/* Featured + latest rail */}
      <section className="container-site pt-8 md:pt-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <article className="group lg:col-span-8">
            <Link href={`/news/${featured.slug}`} className="block">
              <MediaImage
                src={featured.featuredImage}
                alt={featured.title}
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="aspect-[4/3] md:aspect-[16/10]"
                imgClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
              />
              <div className="relative -mt-16 ml-0 mr-4 bg-white pr-6 pt-6 md:-mt-28 md:mr-24 md:pr-10 md:pt-8">
                <div className="flex items-center gap-3">
                  <span className="bg-brand px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                    {featured.isFeatured ? "Featured" : "Latest"}
                  </span>
                  <CategoryLabel category={featured.category} />
                </div>
                <h1 className="headline mt-4 text-[2.4rem] leading-[1.02] md:text-6xl lg:text-[4.4rem] group-hover:text-brand">
                  {featured.title}
                </h1>
                {featured.excerpt && (
                  <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-muted md:text-xl">
                    {featured.excerpt}
                  </p>
                )}
                <ArticleMeta article={featured} className="mt-5 text-sm" />
              </div>
            </Link>
          </article>

          {latest.length > 0 && (
            <aside className="lg:col-span-4 lg:border-l lg:border-line lg:pl-10">
              <SectionHeading title="Latest News" href="/news" />
              <ol className="space-y-7">
                {latest.map((a) => (
                  <li key={a.id} className="group">
                    <Link href={`/news/${a.slug}`} className="grid grid-cols-[4.5rem_1fr] gap-4">
                      <time
                        dateTime={a.publishedAt?.toISOString()}
                        className="pt-1 text-[12px] font-semibold uppercase leading-tight tracking-wider text-brand"
                      >
                        {a.publishedAt ? formatDate(a.publishedAt, "short") : ""}
                      </time>
                      <div>
                        <h3 className="headline text-[19px] leading-snug group-hover:text-brand">{a.title}</h3>
                        {a.excerpt && (
                          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{a.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link
                href="/news"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 border border-ink py-3 text-[13px] font-semibold uppercase tracking-[0.14em] transition hover:bg-ink hover:text-white"
              >
                View all news <ArrowUpRight className="size-4" />
              </Link>
            </aside>
          )}
        </div>
      </section>

      {/* Editorial grid */}
      {gridArticles.length > 0 && (
        <section className="container-site mt-20 md:mt-28">
          <SectionHeading title="Top Stories" href="/news" />
          <EditorialGrid articles={gridArticles} />
        </section>
      )}

      {/* Recent events */}
      {events.length > 0 && (
        <section className="mt-20 bg-paper py-16 md:mt-28 md:py-24">
          <div className="container-site">
            <SectionHeading title="Recent Events" href="/events" linkLabel="All events" />
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              {events.slice(0, 1).map((event) => (
                <article key={event.id} className="group lg:col-span-7">
                  <Link href={`/events/${event.slug}`} className="block">
                    <MediaImage
                      src={event.coverImage}
                      alt={event.title}
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="aspect-[16/10]"
                      imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </Link>
                  <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="kicker text-brand">{formatDateRange(event.startDate, event.endDate)}</p>
                      <Link href={`/events/${event.slug}`}>
                        <h3 className="headline mt-2 text-3xl md:text-4xl group-hover:text-brand">{event.title}</h3>
                      </Link>
                      {event.location && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                          <MapPin className="size-4" /> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.articles.length > 0 && (
                    <ul className="mt-6 divide-y divide-line border-y border-line">
                      {event.articles.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`/news/${a.slug}`}
                            className="flex items-center justify-between gap-4 py-3.5 font-serif text-[17px] hover:text-brand"
                          >
                            {a.title}
                            <ArrowUpRight className="size-4 shrink-0 text-muted" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
              <div className="grid content-start gap-8 lg:col-span-5">
                {events.slice(1).map((event) => (
                  <article key={event.id} className="group">
                    <Link href={`/events/${event.slug}`} className="grid grid-cols-[8rem_1fr] gap-5 md:grid-cols-[11rem_1fr]">
                      <MediaImage
                        src={event.coverImage}
                        alt={event.title}
                        sizes="176px"
                        className="aspect-[4/5]"
                        imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="py-1">
                        <p className="kicker text-brand">{formatDateRange(event.startDate, event.endDate)}</p>
                        <h3 className="headline mt-2 text-2xl leading-tight group-hover:text-brand">{event.title}</h3>
                        {event.location && <p className="mt-2 text-sm text-muted">{event.location}</p>}
                        <p className="mt-3 text-[13px] text-muted">
                          {event._count.articles} {event._count.articles === 1 ? "article" : "articles"} ·{" "}
                          {event._count.media} media
                        </p>
                        {event.articles[0] && (
                          <p className="mt-2 line-clamp-2 font-serif text-[15px] text-ink/80">
                            Latest: {event.articles[0].title}
                          </p>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo highlights */}
      {photos.length > 0 && (
        <section className="bg-ink py-16 text-white md:py-24">
          <div className="container-site">
            <SectionHeading title="Photo Highlights" href="/gallery" linkLabel="Open gallery" invert />
            <PhotoGrid items={toGridItems(photos)} variant="highlights" />
          </div>
        </section>
      )}
    </>
  );
}
