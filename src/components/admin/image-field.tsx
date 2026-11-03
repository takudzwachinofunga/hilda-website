"use client";

import { useState } from "react";
import { ImagePlus, Link2, X } from "lucide-react";

import type { MediaItemDTO } from "@/app/admin/actions/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/components/admin/media-picker";

/** Single image chooser backed by the media library. Writes the URL to a hidden input. */
export function ImageField({
  name,
  defaultValue,
  eventId,
  onCaption,
  aspect = "aspect-[16/10]",
}: {
  name: string;
  defaultValue?: string | null;
  eventId?: string | null;
  onCaption?: (caption: string) => void;
  aspect?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className={`group relative overflow-hidden rounded-lg border border-line bg-paper ${aspect}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
          <img src={url} alt="" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Replace
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setUrl("")} aria-label="Remove image">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-white text-muted transition hover:border-ink/30 hover:text-ink ${aspect}`}
        >
          <ImagePlus className="size-7 text-brand" />
          <span className="text-sm font-medium">Choose or upload image</span>
        </button>
      )}
      <div className="mt-2">
        {manual ? (
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              defaultValue={url}
              onBlur={(e) => setUrl(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setUrl((e.target as HTMLInputElement).value.trim());
                  setManual(false);
                }
              }}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setManual(false)}>
              Done
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setManual(true)}
            className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
          >
            <Link2 className="size-3" /> Paste an image URL instead
          </button>
        )}
      </div>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        eventId={eventId}
        onSelect={(items: MediaItemDTO[]) => {
          const item = items[0];
          if (!item) return;
          setUrl(item.url);
          if (item.caption) onCaption?.(item.caption);
        }}
      />
    </div>
  );
}
