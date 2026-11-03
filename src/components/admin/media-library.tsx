"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, Pencil, Play, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { addExternalMedia, deleteMedia, updateMedia } from "@/app/admin/actions/media";
import type { ActionState } from "@/lib/action-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/admin/media-uploader";
import { ConfirmAction, Panel, SubmitButton, nativeSelectClass } from "@/components/admin/ui";

export type LibraryItem = {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  caption: string | null;
  location: string | null;
  takenAt: string;
  eventId: string | null;
  eventTitle: string | null;
  articleId: string | null;
  articleTitle: string | null;
  publicId: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  createdAt: string;
};

type Option = { id: string; title: string };

export function MediaLibrary({
  items,
  events,
  articles,
  cloudinaryReady,
  defaultEventId,
}: {
  items: LibraryItem[];
  events: Option[];
  articles: Option[];
  cloudinaryReady: boolean;
  defaultEventId: string | null;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"upload" | "link" | null>(null);
  const [uploadEvent, setUploadEvent] = useState(defaultEventId ?? "");
  const [editing, setEditing] = useState<LibraryItem | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setPanel(panel === "upload" ? null : "upload")}>
          <Upload className="size-4" /> Upload media
        </Button>
        <Button type="button" variant="outline" onClick={() => setPanel(panel === "link" ? null : "link")}>
          <Link2 className="size-4" /> Add video link
        </Button>
      </div>

      {panel === "upload" && (
        <Panel className="mb-6 space-y-4 p-4">
          {!cloudinaryReady && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Cloudinary is not configured yet. Add <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>{" "}
              and <code>CLOUDINARY_API_SECRET</code> to your environment to enable uploads.
            </p>
          )}
          <div className="max-w-sm">
            <Label htmlFor="upload-event" className="mb-1.5 block text-[13px]">
              Assign uploads to event
            </Label>
            <select
              id="upload-event"
              value={uploadEvent}
              onChange={(e) => setUploadEvent(e.target.value)}
              className={nativeSelectClass}
            >
              <option value="">No event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
          <MediaUploader eventId={uploadEvent || null} onUploaded={() => router.refresh()} />
        </Panel>
      )}

      {panel === "link" && <ExternalMediaForm events={events} onDone={() => setPanel(null)} />}

      {items.length === 0 ? (
        <Panel className="px-6 py-16 text-center">
          <p className="font-display text-2xl">No media found.</p>
          <p className="mt-2 text-sm text-muted">Upload photographs or add a video link to get started.</p>
        </Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const thumb = item.thumbnailUrl ?? (item.type === "IMAGE" ? item.url : null);
            return (
              <li key={item.id}>
                <Panel className="group overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="relative block aspect-[4/3] w-full bg-paper"
                    aria-label="Edit media"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img src={thumb} alt={item.caption ?? ""} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-ink text-white">
                        <Play className="size-8" />
                      </div>
                    )}
                    {item.type === "VIDEO" && (
                      <span className="absolute left-2 top-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Video
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <Pencil className="size-5" />
                    </span>
                  </button>
                  <div className="p-3">
                    <p className={cn("line-clamp-2 min-h-[2.5em] text-[13px]", !item.caption && "italic text-muted")}>
                      {item.caption || item.title || "No caption"}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-muted">{item.eventTitle ?? "No event"}</p>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <EditMediaDialog
        item={editing}
        onClose={() => setEditing(null)}
        events={events}
        articles={articles}
      />
    </>
  );
}

function ExternalMediaForm({ events, onDone }: { events: Option[]; onDone: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(addExternalMedia, {});
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Added.");
      onDone();
    } else if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Panel className="mb-6 p-4">
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="ext-url" className="mb-1.5 block text-[13px]">
            URL
          </Label>
          <Input id="ext-url" name="url" required placeholder="https://www.youtube.com/watch?v=…" />
          <p className="mt-1 text-[12px] text-muted">YouTube, Vimeo, Facebook video, or a direct image/video link.</p>
        </div>
        <div>
          <Label htmlFor="ext-type" className="mb-1.5 block text-[13px]">
            Type
          </Label>
          <select id="ext-type" name="type" defaultValue="VIDEO" className={nativeSelectClass}>
            <option value="VIDEO">Video</option>
            <option value="IMAGE">Image</option>
          </select>
        </div>
        <div>
          <Label htmlFor="ext-event" className="mb-1.5 block text-[13px]">
            Event
          </Label>
          <select id="ext-event" name="eventId" defaultValue="" className={nativeSelectClass}>
            <option value="">No event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="ext-title" className="mb-1.5 block text-[13px]">
            Title
          </Label>
          <Input id="ext-title" name="title" />
        </div>
        <div>
          <Label htmlFor="ext-date" className="mb-1.5 block text-[13px]">
            Date
          </Label>
          <Input id="ext-date" name="takenAt" type="date" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="ext-caption" className="mb-1.5 block text-[13px]">
            Caption
          </Label>
          <Input id="ext-caption" name="caption" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="ext-thumb" className="mb-1.5 block text-[13px]">
            Thumbnail URL <span className="font-normal text-muted">(optional; YouTube is automatic)</span>
          </Label>
          <Input id="ext-thumb" name="thumbnailUrl" placeholder="https://…" />
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <SubmitButton>
            <Plus className="size-4" /> Add to library
          </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}

function EditMediaDialog({
  item,
  onClose,
  events,
  articles,
}: {
  item: LibraryItem | null;
  onClose: () => void;
  events: Option[];
  articles: Option[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateMedia, {});
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onClose();
    } else if (state.error) toast.error(state.error);
    // Run once per action result, not when the parent re-creates onClose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const thumb = item ? (item.thumbnailUrl ?? (item.type === "IMAGE" ? item.url : null)) : null;

  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>Edit media</DialogTitle>
              <DialogDescription>
                {item.type === "VIDEO" ? "Video" : "Photograph"}
                {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                {item.bytes ? ` · ${(item.bytes / 1024 / 1024).toFixed(1)} MB` : ""}
                {item.format ? ` · ${item.format.toUpperCase()}` : ""}
                {item.publicId ? " · Cloudinary" : " · External link"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 md:grid-cols-[16rem_1fr]">
              <div>
                <div className="aspect-square overflow-hidden rounded-md bg-paper">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview
                    <img src={thumb} alt="" className="size-full object-contain" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-ink text-white">
                      <Play className="size-8" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(item.url);
                      toast.success("URL copied — paste it into an article.");
                    } catch {
                      toast.error("Could not copy.");
                    }
                  }}
                >
                  <Copy className="size-3.5" /> Copy URL
                </Button>
              </div>
              <form id="edit-media" action={action} className="space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <div>
                  <Label htmlFor="m-title" className="mb-1.5 block text-[13px]">
                    Title
                  </Label>
                  <Input id="m-title" name="title" defaultValue={item.title ?? ""} />
                </div>
                <div>
                  <Label htmlFor="m-caption" className="mb-1.5 block text-[13px]">
                    Caption
                  </Label>
                  <Textarea id="m-caption" name="caption" rows={3} defaultValue={item.caption ?? ""} maxLength={500} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="m-event" className="mb-1.5 block text-[13px]">
                      Event
                    </Label>
                    <select id="m-event" name="eventId" defaultValue={item.eventId ?? ""} className={nativeSelectClass}>
                      <option value="">No event</option>
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="m-article" className="mb-1.5 block text-[13px]">
                      Associated article
                    </Label>
                    <select id="m-article" name="articleId" defaultValue={item.articleId ?? ""} className={nativeSelectClass}>
                      <option value="">None</option>
                      {articles.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="m-date" className="mb-1.5 block text-[13px]">
                      Date taken
                    </Label>
                    <Input id="m-date" name="takenAt" type="date" defaultValue={item.takenAt} />
                  </div>
                  <div>
                    <Label htmlFor="m-location" className="mb-1.5 block text-[13px]">
                      Location
                    </Label>
                    <Input id="m-location" name="location" defaultValue={item.location ?? ""} />
                  </div>
                </div>
                {item.type === "VIDEO" && (
                  <div>
                    <Label htmlFor="m-thumb" className="mb-1.5 block text-[13px]">
                      Thumbnail URL
                    </Label>
                    <Input id="m-thumb" name="thumbnailUrl" defaultValue={item.thumbnailUrl ?? ""} />
                  </div>
                )}
              </form>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <ConfirmAction
                action={async (fd) => {
                  await deleteMedia(fd);
                  onClose();
                  toast.success("Media deleted.");
                }}
                fields={{ id: item.id }}
                title="Delete this media item?"
                description={
                  item.publicId
                    ? "The file will be removed from Cloudinary and from any article or event that uses it."
                    : "The link will be removed from the library."
                }
                variant="ghost"
                className="text-brand"
              >
                <Trash2 className="size-4" /> Delete
              </ConfirmAction>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" form="edit-media">
                  Save
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
