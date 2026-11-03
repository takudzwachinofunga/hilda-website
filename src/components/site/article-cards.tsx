import Link from "next/link";
import { MapPin } from "lucide-react";

import type { ArticleCardData } from "@/lib/queries";
import { formatDate } from "@/lib/utils-text";
import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/site/media-image";

export function CategoryLabel({
  category,
  className,
}: {
  category: { name: string; slug: string } | null;
  className?: string;
}) {
  if (!category) return null;
  return (
    <span className={cn("kicker text-brand", className)}>{category.name}</span>
  );
}

export function ArticleMeta({
  article,
  className,
  showLocation = true,
}: {
  article: ArticleCardData;
  className?: string;
  showLocation?: boolean;
}) {
  const location = article.eventLocation ?? article.event?.location;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted", className)}>
      {article.publishedAt && (
        <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
      )}
      {showLocation && location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden />
          {location}
        </span>
      )}
    </div>
  );
}

type CardProps = { article: ArticleCardData; className?: string; priority?: boolean };

/** Huge image, headline beneath, large excerpt. Spans two columns in the grid. */
export function LargeCard({ article, className, priority }: CardProps) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/news/${article.slug}`} className="block">
        <MediaImage
          src={article.featuredImage}
          alt={article.title}
          priority={priority}
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="aspect-[3/2]"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="mt-5">
          <CategoryLabel category={article.category} />
          <h3 className="headline mt-2 text-3xl md:text-[2.6rem] md:leading-[1.05] group-hover:text-brand">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">{article.excerpt}</p>
          )}
          <ArticleMeta article={article} className="mt-4" />
        </div>
      </Link>
    </article>
  );
}

/** Stacked side card: image + headline, compact. */
export function SideCard({ article, className }: CardProps) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/news/${article.slug}`} className="block">
        <MediaImage
          src={article.featuredImage}
          alt={article.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <CategoryLabel category={article.category} className="mt-4 block" />
        <h3 className="headline mt-1.5 text-xl leading-snug group-hover:text-brand">{article.title}</h3>
        <ArticleMeta article={article} className="mt-2" showLocation={false} />
      </Link>
    </article>
  );
}

/** Medium card with a taller portrait crop for rhythm variation. */
export function MediumCard({ article, className, tall }: CardProps & { tall?: boolean }) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/news/${article.slug}`} className="block">
        <MediaImage
          src={article.featuredImage}
          alt={article.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={tall ? "aspect-[4/5]" : "aspect-[4/3]"}
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <CategoryLabel category={article.category} className="mt-4 block" />
        <h3 className="headline mt-1.5 text-2xl leading-tight group-hover:text-brand">{article.title}</h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{article.excerpt}</p>
        )}
        <ArticleMeta article={article} className="mt-3" />
      </Link>
    </article>
  );
}

/** Full-width horizontal story: image on one side, big type on the other. */
export function WideCard({ article, className, reverse }: CardProps & { reverse?: boolean }) {
  return (
    <article className={cn("group border-y border-line py-8 md:py-10", className)}>
      <Link
        href={`/news/${article.slug}`}
        className={cn(
          "grid items-center gap-6 md:grid-cols-12 md:gap-10",
          reverse && "md:[&>*:first-child]:order-2",
        )}
      >
        <MediaImage
          src={article.featuredImage}
          alt={article.title}
          sizes="(min-width: 768px) 58vw, 100vw"
          className="aspect-[16/9] md:col-span-7"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="md:col-span-5">
          <CategoryLabel category={article.category} />
          <h3 className="headline mt-2 text-3xl md:text-4xl md:leading-[1.08] group-hover:text-brand">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-4 text-[17px] leading-relaxed text-muted">{article.excerpt}</p>
          )}
          <ArticleMeta article={article} className="mt-5" />
        </div>
      </Link>
    </article>
  );
}

/** Text-led card with a small square thumbnail — used for dense rows. */
export function CompactCard({ article, className, index }: CardProps & { index?: number }) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/news/${article.slug}`} className="flex gap-4">
        {typeof index === "number" ? (
          <span className="font-display text-4xl leading-none text-brand/90 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <CategoryLabel category={article.category} />
          <h3 className="headline mt-1 text-lg leading-snug group-hover:text-brand">{article.title}</h3>
          <ArticleMeta article={article} className="mt-1.5" showLocation={false} />
        </div>
        <MediaImage
          src={article.featuredImage}
          alt=""
          sizes="96px"
          className="size-20 shrink-0 md:size-24"
        />
      </Link>
    </article>
  );
}
