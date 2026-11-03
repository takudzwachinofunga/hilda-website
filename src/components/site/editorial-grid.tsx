import type { ArticleCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  CompactCard,
  LargeCard,
  MediumCard,
  SideCard,
  WideCard,
} from "@/components/site/article-cards";

type Row =
  | { kind: "feature"; items: ArticleCardData[]; reverse: boolean }
  | { kind: "trio"; items: ArticleCardData[] }
  | { kind: "wide"; items: ArticleCardData[]; reverse: boolean }
  | { kind: "list"; items: ArticleCardData[] };

/**
 * Arranges articles into a repeating, asymmetrical editorial rhythm:
 * feature (1 large + 2 stacked) → trio (3 medium, middle one tall) → wide (full-width)
 * → list (4 compact) → feature (mirrored) → …
 */
function buildRows(articles: ArticleCardData[]): Row[] {
  const rows: Row[] = [];
  const pattern = ["feature", "trio", "wide", "list"] as const;
  let i = 0;
  let step = 0;
  while (i < articles.length) {
    const remaining = articles.length - i;
    const kind = pattern[step % pattern.length];
    const cycle = Math.floor(step / pattern.length);
    if (kind === "feature" && remaining >= 3) {
      rows.push({ kind, items: articles.slice(i, i + 3), reverse: cycle % 2 === 1 });
      i += 3;
    } else if (kind === "trio" && remaining >= 3) {
      rows.push({ kind, items: articles.slice(i, i + 3) });
      i += 3;
    } else if (kind === "wide") {
      rows.push({ kind, items: articles.slice(i, i + 1), reverse: cycle % 2 === 1 });
      i += 1;
    } else if (kind === "list" && remaining >= 2) {
      const n = Math.min(4, remaining);
      rows.push({ kind, items: articles.slice(i, i + n) });
      i += n;
    } else if (remaining <= 2) {
      // Tail: render leftovers as wide or a pair of medium cards.
      if (remaining === 1) rows.push({ kind: "wide", items: articles.slice(i), reverse: false });
      else rows.push({ kind: "trio", items: articles.slice(i) });
      i = articles.length;
    }
    step++;
  }
  return rows;
}

export function EditorialGrid({
  articles,
  className,
  priorityFirst,
}: {
  articles: ArticleCardData[];
  className?: string;
  priorityFirst?: boolean;
}) {
  const rows = buildRows(articles);
  return (
    <div className={cn("space-y-14 md:space-y-20", className)}>
      {rows.map((row, r) => {
        if (row.kind === "feature") {
          const [lead, ...side] = row.items;
          return (
            <div key={r} className="grid gap-10 lg:grid-cols-3 lg:gap-12">
              <LargeCard
                article={lead}
                priority={priorityFirst && r === 0}
                className={cn("lg:col-span-2", row.reverse && "lg:order-2")}
              />
              <div
                className={cn(
                  "grid gap-10 sm:grid-cols-2 lg:grid-cols-1 lg:content-start lg:border-line",
                  row.reverse ? "lg:border-r lg:pr-12" : "lg:border-l lg:pl-12",
                )}
              >
                {side.map((a) => (
                  <SideCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          );
        }
        if (row.kind === "trio") {
          return (
            <div
              key={r}
              className={cn(
                "grid gap-10 sm:grid-cols-2 lg:gap-12",
                row.items.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
              )}
            >
              {row.items.map((a, idx) => (
                <MediumCard
                  key={a.id}
                  article={a}
                  tall={row.items.length >= 3 && idx === 1}
                  className={cn(row.items.length >= 3 && idx === 2 && "sm:col-span-2 lg:col-span-1")}
                />
              ))}
            </div>
          );
        }
        if (row.kind === "wide") {
          return <WideCard key={r} article={row.items[0]} reverse={row.reverse} />;
        }
        return (
          <div key={r} className="grid gap-x-12 gap-y-8 border-t-2 border-ink pt-8 md:grid-cols-2">
            {row.items.map((a) => (
              <CompactCard key={a.id} article={a} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
