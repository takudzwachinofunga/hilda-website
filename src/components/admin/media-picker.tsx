"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Loader2, Play, Search } from "lucide-react";

import { listMediaForPicker, type MediaItemDTO } from "@/app/admin/actions/media";
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
import { MediaUploader } from "@/components/admin/media-uploader";

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  type = "IMAGE",
  eventId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaItemDTO[]) => void;
  multiple?: boolean;
  type?: "IMAGE" | "VIDEO" | "ALL";
  eventId?: string | null;
  title?: string;
}) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItemDTO[]>([]);
  const [selected, setSelected] = useState<MediaItemDTO[]>([]);
  const [loading, startLoading] = useTransition();

  const load = useCallback(
    (query: string) => {
      startLoading(async () => {
        const result = await listMediaForPicker({ q: query, type: type === "ALL" ? undefined : type });
        setItems(result);
      });
    },
    [type],
  );

  // Reset selection and reload each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTab("library");
      setSelected([]);
    }
  }
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, open, load]);

  const toggle = (item: MediaItemDTO) => {
    if (!multiple) {
      setSelected([item]);
      return;
    }
    setSelected((s) => (s.some((x) => x.id === item.id) ? s.filter((x) => x.id !== item.id) : [...s, item]));
  };

  const uploadAccept = type === "IMAGE" ? "image" : type === "VIDEO" ? "video" : "both";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-line p-5">
          <DialogTitle>{title ?? (multiple ? "Select photographs" : "Select an image")}</DialogTitle>
          <DialogDescription>Choose from the media library or upload new files.</DialogDescription>
          <div className="mt-3 flex gap-1">
            {(["library", "upload"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                  tab === t ? "bg-ink text-white" : "text-muted hover:bg-paper",
                )}
              >
                {t === "library" ? "Library" : "Upload"}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "upload" ? (
            <MediaUploader
              accept={uploadAccept}
              eventId={eventId}
              onUploaded={(m) => {
                setItems((all) => [m, ...all]);
                setSelected((s) => (multiple ? [...s, m] : [m]));
              }}
            />
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search captions, titles or events…"
                  className="pl-9"
                />
              </div>
              {loading && items.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-muted" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted">
                  No media found.{" "}
                  <button type="button" className="text-brand underline" onClick={() => setTab("upload")}>
                    Upload some
                  </button>
                  .
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {items.map((item) => {
                    const isSelected = selected.some((s) => s.id === item.id);
                    const thumb = item.thumbnailUrl ?? (item.type === "IMAGE" ? item.url : null);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item)}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-md bg-paper ring-offset-2 transition",
                          isSelected ? "ring-2 ring-brand" : "hover:opacity-90",
                        )}
                        title={item.caption ?? item.title ?? ""}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails
                          <img src={thumb} alt={item.caption ?? ""} className="size-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-ink text-white">
                            <Play className="size-6" />
                          </div>
                        )}
                        {item.type === "VIDEO" && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                            Video
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-brand text-white">
                            <Check className="size-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-line p-4">
          <span className="mr-auto self-center text-sm text-muted">
            {selected.length} selected
          </span>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected);
              onOpenChange(false);
            }}
          >
            {multiple ? "Add selected" : "Use image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
