import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between border-t border-line pt-6">
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, params, page - 1)}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Newer
        </Link>
      ) : (
        <span />
      )}
      <ol className="flex items-center gap-1">
        {pages.map((p, i) => (
          <li key={p} className="flex items-center">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-2 text-muted">…</span>}
            <Link
              href={hrefFor(basePath, params, p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center text-sm tabular-nums",
                p === page ? "bg-ink text-white" : "hover:bg-paper",
              )}
            >
              {p}
            </Link>
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <Link
          href={hrefFor(basePath, params, page + 1)}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-brand"
        >
          Older <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
