"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import slugifyLib from "slugify";

import { saveEvent } from "@/app/admin/actions/events";
import type { MediaItemDTO } from "@/app/admin/actions/media";
import type { ActionState } from "@/lib/action-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GalleryField } from "@/components/admin/gallery-field";
import { ImageField } from "@/components/admin/image-field";
import { FieldError, Panel, SubmitButton, nativeSelectClass, useActionToast } from "@/components/admin/ui";

export type EventFormData = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  articles: { id: string; title: string }[];
  media: MediaItemDTO[];
};

const toSlug = (s: string) => slugifyLib(s, { lower: true, strict: true, trim: true }).slice(0, 96);

export function EventForm({
  event,
  allArticles,
}: {
  event: EventFormData;
  allArticles: { id: string; title: string; eventId: string | null }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveEvent, {});
  useActionToast(state);
  const fe = state.fieldErrors ?? {};

  const [title, setTitle] = useState(event.title);
  const [slug, setSlug] = useState(event.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(event.id));
  const [articles, setArticles] = useState(event.articles);

  const available = allArticles.filter((a) => !articles.some((x) => x.id === a.id));

  return (
    <form action={formAction} className="space-y-6">
      {event.id && <input type="hidden" name="id" value={event.id} />}
      <input type="hidden" name="articleIds" value={JSON.stringify(articles.map((a) => a.id))} />

      <div className="sticky top-14 z-20 -mx-4 flex items-center gap-2 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <Link href="/admin/events" className="mr-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Events
        </Link>
        <SubmitButton size="sm">{event.id ? "Save changes" : "Create event"}</SubmitButton>
      </div>

      {state.error && !state.ok && (
        <p role="alert" className="rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel className="space-y-5 p-5">
            <div>
              <Label htmlFor="title" className="mb-1.5 block">
                Event name
              </Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(toSlug(e.target.value));
                }}
                className="h-11 text-lg"
                aria-invalid={Boolean(fe.title)}
              />
              <FieldError error={fe.title} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-muted">/events/</span>
              <Input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                onBlur={() => setSlug((s) => toSlug(s) || toSlug(title))}
                aria-label="URL slug"
                className="h-8 font-mono text-[13px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="startDate" className="mb-1.5 block">
                  Date
                </Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={event.startDate} aria-invalid={Boolean(fe.startDate)} />
                <FieldError error={fe.startDate} />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-1.5 block">
                  End date <span className="font-normal text-muted">(optional)</span>
                </Label>
                <Input id="endDate" name="endDate" type="date" defaultValue={event.endDate} />
                <FieldError error={fe.endDate} />
              </div>
              <div>
                <Label htmlFor="location" className="mb-1.5 block">
                  Location
                </Label>
                <Input id="location" name="location" defaultValue={event.location} placeholder="e.g. Bulawayo" />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="mb-1.5 block">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={event.description}
                rows={7}
                placeholder="What happened, who attended, why it mattered. Separate paragraphs with a blank line."
                className="font-serif text-[16px]"
              />
              <FieldError error={fe.description} />
            </div>
          </Panel>

          <Panel className="space-y-3 p-5">
            <h2 className="font-semibold">Associated articles</h2>
            {articles.length > 0 ? (
              <ul className="divide-y divide-line rounded-md border border-line">
                {articles.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="truncate">{a.title}</span>
                    <button
                      type="button"
                      onClick={() => setArticles((all) => all.filter((x) => x.id !== a.id))}
                      className="rounded p-1 text-muted hover:text-brand"
                      aria-label={`Remove ${a.title}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No articles linked yet.</p>
            )}
            {available.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const a = allArticles.find((x) => x.id === e.target.value);
                  if (a) setArticles((all) => [...all, { id: a.id, title: a.title }]);
                }}
                className={nativeSelectClass}
                aria-label="Add an article"
              >
                <option value="">+ Link an existing article…</option>
                {available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                    {a.eventId ? " (linked to another event)" : ""}
                  </option>
                ))}
              </select>
            )}
            {event.id && (
              <Link href={`/admin/articles/new?event=${event.id}`} className="inline-block text-sm text-brand hover:underline">
                + Write a new article for this event
              </Link>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="space-y-3 p-5">
            <h2 className="font-semibold">Cover image</h2>
            <ImageField name="coverImage" defaultValue={event.coverImage} eventId={event.id} />
            <FieldError error={fe.coverImage} />
          </Panel>
          <Panel className="space-y-3 p-5">
            <h2 className="font-semibold">Photographs &amp; videos</h2>
            <p className="text-[13px] text-muted">Media shown on the event page and filterable in the gallery.</p>
            <GalleryField name="mediaIds" defaultItems={event.media} eventId={event.id} type="ALL" label="Add media" />
          </Panel>
        </div>
      </div>
    </form>
  );
}
