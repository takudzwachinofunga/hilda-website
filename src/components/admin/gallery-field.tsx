"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Images, Play, X } from "lucide-react";

import type { MediaItemDTO } from "@/app/admin/actions/media";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";

/** Ordered list of media IDs (additional photographs), stored as JSON in a hidden input. */
export function GalleryField({
  name,
  defaultItems,
  eventId,
  type = "IMAGE",
  label = "Add photographs",
}: {
  name: string;
  defaultItems: MediaItemDTO[];
  eventId?: string | null;
  type?: "IMAGE" | "ALL";
  label?: string;
}) {
  const [items, setItems] = useState<MediaItemDTO[]>(defaultItems);
  const [open, setOpen] = useState(false);

  const move = (i: number, dir: -1 | 1) =>
    setItems((all) => {
      const next = [...all];
      const j = i + dir;
      if (j < 0 || j >= next.length) return all;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items.map((i) => i.id))} />
      {items.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item, i) => {
            const thumb = item.thumbnailUrl ?? (item.type === "IMAGE" ? item.url : null);
            return (
              <li key={item.id} className="group relative aspect-square overflow-hidden rounded-md bg-paper">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview
                  <img src={thumb} alt={item.caption ?? ""} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-ink text-white">
                    <Play className="size-5" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-100 transition group-hover:bg-black/30 md:opacity-0 md:group-hover:opacity-100">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1" aria-label="Move earlier">
                      <ArrowLeft className="size-3" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1" aria-label="Move later">
                      <ArrowRight className="size-3" />
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems((all) => all.filter((x) => x.id !== item.id))}
                    className="rounded bg-white/90 p-1 hover:text-brand"
                    aria-label="Remove"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full">
        <Images className="size-4" /> {label}
      </Button>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        multiple
        type={type}
        eventId={eventId}
        onSelect={(selected) =>
          setItems((all) => [...all, ...selected.filter((s) => !all.some((a) => a.id === s.id))])
        }
      />
    </div>
  );
}
