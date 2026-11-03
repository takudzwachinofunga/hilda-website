"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/site/lightbox";

/**
 * Renders sanitised article HTML. Inline images open in a lightbox together with the
 * article's lead and gallery photographs, so readers can page through all of them.
 */
export function ArticleBody({
  html,
  extraItems = [],
}: {
  html: string;
  extraItems?: LightboxItem[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const inlineItems = useMemo<LightboxItem[]>(() => {
    const matches = Array.from(html.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g));
    return matches.map((m, i) => {
      const caption = m[0].match(/data-caption="([^"]*)"/)?.[1] ?? m[0].match(/alt="([^"]*)"/)?.[1];
      return {
        id: `inline-${i}`,
        type: "IMAGE" as const,
        src: decodeEntities(m[1]),
        caption: caption ? decodeEntities(caption) : null,
      };
    });
  }, [html]);

  const items = useMemo(() => [...inlineItems, ...extraItems], [inlineItems, extraItems]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG" || !ref.current) return;
      const imgs = Array.from(ref.current.querySelectorAll("img"));
      const i = imgs.indexOf(target as HTMLImageElement);
      if (i >= 0) setIndex(i);
    },
    [],
  );

  return (
    <>
      <div
        ref={ref}
        onClick={onClick}
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <Lightbox items={items} index={index} onChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
