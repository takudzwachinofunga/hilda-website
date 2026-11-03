"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";

import { Lightbox } from "@/components/site/lightbox";

export function FeaturedImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="mx-auto mt-10 max-w-[90rem] md:mt-12 md:px-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[3/2] w-full overflow-hidden bg-paper md:aspect-[16/9]"
        aria-label="View photograph full screen"
      >
        <Image src={src} alt={alt} fill priority sizes="(min-width: 1440px) 1440px, 100vw" className="object-cover" />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100">
          <Expand className="size-4" />
        </span>
      </button>
      {caption && (
        <figcaption className="container-site mt-3 text-[13px] leading-relaxed text-muted md:px-0">
          {caption}
        </figcaption>
      )}
      <Lightbox
        items={[{ id: "featured", type: "IMAGE", src, caption: caption ?? alt }]}
        index={open ? 0 : null}
        onChange={() => {}}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}
