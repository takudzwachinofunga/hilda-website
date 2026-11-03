"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Star } from "lucide-react";
import slugifyLib from "slugify";

import { saveArticle } from "@/app/admin/actions/articles";
import type { MediaItemDTO } from "@/app/admin/actions/media";
import type { ActionState } from "@/lib/action-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor";
import { GalleryField } from "@/components/admin/gallery-field";
import { ImageField } from "@/components/admin/image-field";
import { FieldError, Panel, StatusBadge, SubmitButton, nativeSelectClass, useActionToast } from "@/components/admin/ui";

export type ArticleFormData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageCaption: string | null;
  videoUrl: string | null;
  categoryId: string | null;
  eventId: string | null;
  eventDate: string;
  eventLocation: string | null;
  publishedAt: string;
  status: string;
  isFeatured: boolean;
  tags: string;
  gallery: MediaItemDTO[];
};

type EventOption = { id: string; title: string; startDate: string; location: string | null };

const toSlug = (s: string) => slugifyLib(s, { lower: true, strict: true, trim: true }).slice(0, 96);

export function ArticleForm({
  article,
  categories,
  events,
}: {
  article: ArticleFormData;
  categories: { id: string; name: string }[];
  events: EventOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveArticle, {});
  useActionToast(state);
  const fe = state.fieldErrors ?? {};

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(article.id));
  const [eventId, setEventId] = useState(article.eventId ?? "");
  const [eventDate, setEventDate] = useState(article.eventDate);
  const [eventLocation, setEventLocation] = useState(article.eventLocation ?? "");
  const [caption, setCaption] = useState(article.featuredImageCaption ?? "");
  const [featured, setFeatured] = useState(article.isFeatured);
  const [excerpt, setExcerpt] = useState(article.excerpt);

  const isPublished = article.status === "PUBLISHED";

  const onEventChange = (id: string) => {
    setEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev) {
      if (!eventDate) setEventDate(ev.startDate);
      if (!eventLocation && ev.location) setEventLocation(ev.location);
    }
  };

  return (
    <form action={formAction}>
      {article.id && <input type="hidden" name="id" value={article.id} />}

      {/* Action bar */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <Link href="/admin/articles" className="mr-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Articles
        </Link>
        {article.id && <StatusBadge status={article.status} />}
        <SubmitButton name="intent" value="preview" variant="ghost" size="sm">
          <Eye className="size-4" /> Preview
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="outline" size="sm">
          {isPublished ? "Unpublish" : "Save draft"}
        </SubmitButton>
        <SubmitButton name="intent" value="publish" size="sm">
          {isPublished ? "Update" : "Publish"}
        </SubmitButton>
      </div>

      {state.error && !state.ok && (
        <p role="alert" className="mb-6 rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Writing column */}
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="title" className="sr-only">
              Headline
            </label>
            <textarea
              id="title"
              name="title"
              value={title}
              rows={2}
              onChange={(e) => {
                const v = e.target.value.replace(/\n/g, " ");
                setTitle(v);
                if (!slugTouched) setSlug(toSlug(v));
              }}
              placeholder="Headline"
              className={cn(
                "w-full resize-none border-0 border-b bg-transparent pb-3 font-display text-4xl font-semibold leading-tight tracking-tight outline-none placeholder:text-ink/25 md:text-5xl",
                fe.title ? "border-brand" : "border-line focus:border-ink",
              )}
            />
            <FieldError error={fe.title} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted">/news/</span>
            <Input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              onBlur={() => setSlug((s) => toSlug(s) || toSlug(title))}
              aria-label="URL slug"
              className="h-8 bg-white font-mono text-[13px]"
            />
          </div>
          <div>
            <Label htmlFor="excerpt" className="mb-2 block">
              Subtitle / excerpt
            </Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="A one or two sentence summary shown under the headline and in previews."
              className="bg-white font-serif text-[17px]"
            />
            <div className="mt-1 flex justify-between">
              <FieldError error={fe.excerpt} />
              <span className="ml-auto text-[12px] text-muted">{excerpt.length}/400</span>
            </div>
          </div>
          <div>
            <RichTextEditor name="content" defaultValue={article.content} eventId={eventId || null} invalid={Boolean(fe.content)} />
            <FieldError error={fe.content} />
          </div>
        </div>

        {/* Settings column */}
        <div className="space-y-4">
          <Panel className="space-y-4 p-4">
            <h2 className="text-sm font-semibold">Publishing</h2>
            <div>
              <Label htmlFor="publishedAt" className="mb-1.5 block text-[13px]">
                Publication date
              </Label>
              <Input id="publishedAt" name="publishedAt" type="date" defaultValue={article.publishedAt} />
              <p className="mt-1 text-[12px] text-muted">Leave empty to use the moment you publish. A future date schedules the article.</p>
            </div>
            <button
              type="button"
              onClick={() => setFeatured((f) => !f)}
              aria-pressed={featured}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition",
                featured ? "border-brand bg-brand/5 text-brand" : "border-line hover:border-ink/30",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Star className={cn("size-4", featured && "fill-current")} /> Featured article
              </span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition",
                  featured ? "bg-brand" : "bg-line",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                    featured ? "left-[1.125rem]" : "left-0.5",
                  )}
                />
              </span>
            </button>
            <input type="hidden" name="isFeatured" value={featured ? "true" : "false"} />
          </Panel>

          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Featured image</h2>
            <ImageField name="featuredImage" defaultValue={article.featuredImage} eventId={eventId || null} onCaption={(c) => !caption && setCaption(c)} />
            <FieldError error={fe.featuredImage} />
            <Input
              name="featuredImageCaption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Photo caption"
            />
          </Panel>

          <Panel className="space-y-4 p-4">
            <h2 className="text-sm font-semibold">Details</h2>
            <div>
              <Label htmlFor="categoryId" className="mb-1.5 block text-[13px]">
                Category
              </Label>
              <select id="categoryId" name="categoryId" defaultValue={article.categoryId ?? ""} className={nativeSelectClass}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="eventId" className="mb-1.5 block text-[13px]">
                Event
              </Label>
              <select
                id="eventId"
                name="eventId"
                value={eventId}
                onChange={(e) => onEventChange(e.target.value)}
                className={nativeSelectClass}
              >
                <option value="">No event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              <Link href="/admin/events/new" target="_blank" className="mt-1 inline-block text-[12px] text-brand hover:underline">
                + Create a new event
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div>
                <Label htmlFor="eventDate" className="mb-1.5 block text-[13px]">
                  Event date
                </Label>
                <Input id="eventDate" name="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eventLocation" className="mb-1.5 block text-[13px]">
                  Location
                </Label>
                <Input
                  id="eventLocation"
                  name="eventLocation"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Harare"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tags" className="mb-1.5 block text-[13px]">
                Tags
              </Label>
              <Input id="tags" name="tags" defaultValue={article.tags} placeholder="Comma separated, e.g. Farming, Mutare" />
            </div>
          </Panel>

          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Additional photographs</h2>
            <GalleryField name="galleryIds" defaultItems={article.gallery} eventId={eventId || null} />
          </Panel>

          <Panel className="space-y-2 p-4">
            <h2 className="text-sm font-semibold">Video</h2>
            <Input name="videoUrl" defaultValue={article.videoUrl ?? ""} placeholder="YouTube, Vimeo or Cloudinary URL" />
            <FieldError error={fe.videoUrl} />
            <p className="text-[12px] text-muted">
              Upload videos in the{" "}
              <Link href="/admin/media" target="_blank" className="text-brand hover:underline">
                Media Library
              </Link>{" "}
              and paste their URL here.
            </p>
          </Panel>
        </div>
      </div>
    </form>
  );
}
