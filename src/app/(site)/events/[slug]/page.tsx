import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { getEventBySlug } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";
import { formatDateRange, truncate } from "@/lib/utils-text";
import { toGridItems } from "@/lib/gallery-items";
import { EditorialGrid } from "@/components/site/editorial-grid";
import { PhotoGrid } from "@/components/site/photo-grid";
import { SectionHeading } from "@/components/site/section-heading";
import { VideoEmbed } from "@/components/site/video-embed";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };
  const description = truncate(event.description || `Coverage of ${event.title}.`, 160);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "website",
      title: event.title,
      description,
      url: `/events/${event.slug}`,
      images: event.coverImage ? [{ url: event.coverImage, alt: event.title }] : undefined,
    },
  };
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const photos = event.media.filter((m) => m.type === "IMAGE");
  const videos = event.media.filter((m) => m.type === "VIDEO");
  const photoItems = toGridItems(photos.map((m) => ({ ...m, event })));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startDate.toISOString(),
    endDate: (event.endDate ?? event.startDate).toISOString(),
    description: event.description || undefined,
    image: event.coverImage ? [event.coverImage] : undefined,
    location: event.location ? { "@type": "Place", name: event.location, address: event.location } : undefined,
    url: `${siteUrl()}/events/${event.slug}`,
    eventStatus: "https://schema.org/EventScheduled",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="relative bg-ink text-white">
        {event.coverImage && (
          <div className="absolute inset-0">
            <Image src={event.coverImage} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          </div>
        )}
        <div className="container-site relative flex min-h-[26rem] flex-col justify-end pb-12 pt-28 md:min-h-[34rem] md:pb-16">
          <p className="kicker text-white/80">Event</p>
          <h1 className="headline mt-3 max-w-4xl text-5xl text-white md:text-7xl">{event.title}</h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-white/85">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" /> {formatDateRange(event.startDate, event.endDate)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="container-site">
        <div className="grid gap-10 border-b border-line py-12 md:grid-cols-12">
          <div className="md:col-span-8">
            {event.description ? (
              <div className="space-y-4 font-serif text-xl leading-relaxed text-ink/90">
                {event.description.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <p className="font-serif text-xl text-muted">Coverage from {event.title}.</p>
            )}
          </div>
          <dl className="grid grid-cols-3 gap-4 self-start md:col-span-4 md:grid-cols-1 md:border-l md:border-line md:pl-10">
            {[
              ["Articles", event.articles.length],
              ["Photographs", photos.length],
              ["Videos", videos.length],
            ].map(([label, n]) => (
              <div key={label}>
                <dt className="kicker text-muted">{label}</dt>
                <dd className="font-display text-4xl font-semibold">{n}</dd>
              </div>
            ))}
          </dl>
        </div>

        {event.articles.length > 0 && (
          <section className="mt-16">
            <SectionHeading title="Reports from this event" />
            <EditorialGrid articles={event.articles} />
          </section>
        )}

        {photoItems.length > 0 && (
          <section className="mt-20">
            <SectionHeading title="Photographs" />
            <PhotoGrid items={photoItems} />
          </section>
        )}

        {videos.length > 0 && (
          <section className="mt-20">
            <SectionHeading title="Video" />
            <div className="grid gap-10 md:grid-cols-2">
              {videos.map((v) => (
                <figure key={v.id}>
                  <VideoEmbed url={v.url} title={v.title ?? v.caption ?? event.title} />
                  {(v.title || v.caption) && (
                    <figcaption className="mt-3">
                      {v.title && <span className="headline block text-xl">{v.title}</span>}
                      {v.caption && <span className="mt-1 block text-sm text-muted">{v.caption}</span>}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
