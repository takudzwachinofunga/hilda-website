"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Lightbox, type LightboxItem } from "@/components/site/lightbox";

export type PhotoGridItem = LightboxItem & {
  thumb: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Masonry photo grid (CSS columns) that preserves each photo's natural aspect ratio
 * and opens a lightbox with caption, event, date and prev/next navigation.
 */
export function PhotoGrid({
  items,
  variant = "masonry",
  className,
}: {
  items: PhotoGridItem[];
  variant?: "masonry" | "highlights";
  className?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      {variant === "highlights" ? (
        <div
          className={cn(
            "grid auto-rows-[160px] grid-cols-2 gap-2 md:auto-rows-[220px] md:grid-cols-4 md:gap-3",
            className,
          )}
        >
          {items.map((item, i) => {
            // Editorial pattern of varied tile sizes.
            const span = [
              "col-span-2 row-span-2",
              "row-span-1",
              "row-span-2",
              "row-span-1",
              "col-span-2 row-span-1 md:col-span-1",
              "col-span-1 row-span-1",
              "col-span-2 row-span-1",
            ][i % 7];
            return (
              <Tile key={item.id} item={item} onOpen={() => setIndex(i)} className={cn(span, "bg-white/5")} fill />
            );
          })}
        </div>
      ) : (
        <div className={cn("columns-2 gap-2 md:columns-3 md:gap-4 xl:columns-4", className)}>
          {items.map((item, i) => (
            <Tile key={item.id} item={item} onOpen={() => setIndex(i)} className="mb-2 md:mb-4" />
          ))}
        </div>
      )}
      <Lightbox items={items} index={index} onChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}

function Tile({
  item,
  onOpen,
  className,
  fill,
}: {
  item: PhotoGridItem;
  onOpen: () => void;
  className?: string;
  fill?: boolean;
}) {
  const src = item.thumb ?? (item.type === "IMAGE" ? item.src : null);
  const w = item.width ?? 4;
  const h = item.height ?? 3;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative block w-full break-inside-avoid overflow-hidden bg-paper text-left focus-visible:outline-2 focus-visible:outline-brand",
        className,
      )}
      style={fill ? undefined : { aspectRatio: `${w} / ${h}` }}
      aria-label={item.caption ?? item.title ?? "Open media"}
    >
      {src ? (
        <Image
          src={src}
          alt={item.caption ?? ""}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-ink" />
      )}
      {item.type === "VIDEO" && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-brand px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          <Play className="size-3 fill-current" /> Video
        </span>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-[13px] leading-snug text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {item.caption ?? item.title}
        {item.eventTitle && <span className="mt-0.5 block text-white/70">{item.eventTitle}</span>}
      </span>
    </button>
  );
}
