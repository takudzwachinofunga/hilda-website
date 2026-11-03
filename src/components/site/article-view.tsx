import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import type { ArticleCardData, FullArticle } from "@/lib/queries";
import { formatDate, readingTime } from "@/lib/utils-text";
import { toGridItems } from "@/lib/gallery-items";
import { ArticleBody } from "@/components/site/article-body";
import { MediumCard } from "@/components/site/article-cards";
import { PhotoGrid } from "@/components/site/photo-grid";
import { SectionHeading } from "@/components/site/section-heading";
import { VideoEmbed } from "@/components/site/video-embed";
import { ShareLinks } from "@/components/site/share-links";
import { FeaturedImage } from "@/components/site/featured-image";

export function ArticleView({
  article,
  related,
  author,
  shareUrl,
}: {
  article: FullArticle;
  related: ArticleCardData[];
  author: { name: string; bio: string; photo: string | null };
  shareUrl: string;
}) {
  const authorName = author.name;
  const location = article.eventLocation ?? article.event?.location;
  const gallery = toGridItems(
    article.galleryImages.map((m) => ({
      ...m,
      event: article.event,
      article: null,
    })),
  );

  return (
    <article>
      <header className="container-site pt-10 md:pt-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {article.category && (
              <Link href={`/news?category=${article.category.slug}`} className="kicker text-brand hover:text-ink">
                {article.category.name}
              </Link>
            )}
            {article.event && (
              <Link
                href={`/events/${article.event.slug}`}
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-brand"
              >
                {article.event.title}
              </Link>
            )}
          </div>
          <h1 className="headline mt-4 text-[2.5rem] leading-[1.03] md:text-6xl lg:text-7xl">{article.title}</h1>
          {article.excerpt && (
            <p className="mt-6 font-serif text-xl leading-relaxed text-muted md:text-2xl">{article.excerpt}</p>
          )}
          <div className="mt-8 flex flex-col gap-4 border-y border-line py-4 text-[14px] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span>
                By <strong className="font-semibold">{authorName}</strong>
              </span>
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()} className="text-muted">
                  {formatDate(article.publishedAt)}
                </time>
              )}
              <span className="text-muted">{readingTime(article.content)} min read</span>
            </div>
            <ShareLinks url={shareUrl} title={article.title} />
          </div>
          {(article.eventDate || location) && (
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
              {article.eventDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  <dt className="sr-only">Event date</dt>
                  <dd>Event: {formatDate(article.eventDate)}</dd>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  <dt className="sr-only">Location</dt>
                  <dd>{location}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      {article.featuredImage && (
        <FeaturedImage
          src={article.featuredImage}
          alt={article.featuredImageCaption ?? article.title}
          caption={article.featuredImageCaption}
        />
      )}

      <div className="container-site">
        <div className="mx-auto mt-10 max-w-[44rem] md:mt-14">
          <ArticleBody html={article.content} />

          {article.videoUrl && (
            <section className="mt-12">
              <h2 className="kicker mb-3 text-brand">Video</h2>
              <VideoEmbed url={article.videoUrl} title={article.title} />
            </section>
          )}

          {article.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
              {article.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/news?q=${encodeURIComponent(t.name)}`}
                  className="border border-line px-3 py-1.5 text-[13px] text-muted transition hover:border-brand hover:text-brand"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}

          {author.bio && (
            <aside className="mt-12 flex gap-5 border-t-2 border-ink pt-6">
              {author.photo && (
                // eslint-disable-next-line @next/next/no-img-element -- small portrait from settings
                <img src={author.photo} alt={author.name} className="size-16 shrink-0 rounded-full object-cover" />
              )}
              <div>
                <p className="kicker text-brand">About the author</p>
                <p className="headline mt-1 text-xl">{author.name}</p>
                <p className="mt-2 font-serif text-[16px] leading-relaxed text-muted">{author.bio}</p>
              </div>
            </aside>
          )}
        </div>

        {gallery.length > 0 && (
          <section className="mx-auto mt-16 max-w-6xl">
            <SectionHeading
              title="Photographs"
              href={article.event ? `/events/${article.event.slug}` : undefined}
              linkLabel="Event coverage"
            />
            <PhotoGrid items={gallery} />
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-20 md:mt-28">
            <SectionHeading title="Related Coverage" href="/news" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {related.map((a, i) => (
                <MediumCard key={a.id} article={a} tall={i === 1} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
