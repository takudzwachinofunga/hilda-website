"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

import { resizedImageSrc } from "@/lib/image-sources";
import type { VideoEmbed } from "@/lib/video";

export type LightboxItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  src: string;
  caption?: string | null;
  title?: string | null;
  eventTitle?: string | null;
  eventHref?: string | null;
  articleTitle?: string | null;
  articleHref?: string | null;
  date?: string | null;
  location?: string | null;
  embed?: VideoEmbed | null;
};

export function Lightbox({
  items,
  index,
  onChange,
  onClose,
}: {
  items: LightboxItem[];
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null && items[index];
  const count = items.length;

  const prev = useCallback(() => {
    if (index === null) return;
    onChange((index - 1 + count) % count);
  }, [index, count, onChange]);
  const next = useCallback(() => {
    if (index === null) return;
    onChange((index + 1) % count);
  }, [index, count, onChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, prev, next]);

  // Simple swipe support on touch devices.
  const touchX = useRef<number | null>(null);

  if (!open || index === null) return null;
  const item = items[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? "Media viewer"}
      className="fixed inset-0 z-[100] flex flex-col bg-[rgb(10_10_10/0.97)] text-white"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70 md:px-6">
        <span className="tabular-nums">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded-full p-2 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="size-6" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {item.type === "VIDEO" && item.embed ? (
          <div className="aspect-video w-full max-w-5xl bg-black">
            {item.embed.kind === "iframe" ? (
              <iframe
                src={item.embed.src}
                title={item.title ?? item.caption ?? "Video"}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={item.embed.src} poster={item.embed.poster} controls className="size-full" />
            )}
          </div>
        ) : (
          <LightboxImage key={item.id} src={item.src} alt={item.caption ?? ""} />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/5 p-3 transition hover:bg-white/15 md:left-5 md:block"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/5 p-3 transition hover:bg-white/15 md:right-5 md:block"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 pb-6 pt-4 md:pb-8">
        {(item.caption || item.title) && (
          <p className="font-serif text-[17px] leading-relaxed text-white/90">{item.caption || item.title}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/55">
          {item.eventTitle &&
            (item.eventHref ? (
              <Link href={item.eventHref} onClick={onClose} className="text-[#ff5a6e] hover:underline">
                {item.eventTitle}
              </Link>
            ) : (
              <span>{item.eventTitle}</span>
            ))}
          {item.date && <span>{item.date}</span>}
          {item.location && <span>{item.location}</span>}
          {item.articleTitle && item.articleHref && (
            <Link href={item.articleHref} onClick={onClose} className="underline-offset-2 hover:underline">
              Read: {item.articleTitle}
            </Link>
          )}
        </div>
        {count > 1 && (
          <div className="mt-4 flex justify-center gap-6 md:hidden">
            <button type="button" onClick={prev} aria-label="Previous" className="p-2">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" onClick={next} aria-label="Next" className="p-2">
              <ChevronRight className="size-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Wide enough to fill any ordinary screen without pulling a multi-megabyte original. */
const VIEWER_WIDTH = 1920;

function LightboxImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Loader2 className="absolute size-8 animate-spin text-white/40" aria-hidden />}
      {/* eslint-disable-next-line @next/next/no-img-element -- viewer sizes its own source */}
      <img
        src={resizedImageSrc(src, VIEWER_WIDTH) ?? src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`max-h-full max-w-full select-none object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
