"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * A plain GET form (works without JavaScript) that, when JS is available, applies
 * select/date changes immediately and drops empty parameters from the URL.
 */
export function FilterForm({
  action,
  children,
  className,
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  function navigate() {
    const form = ref.current;
    if (!form) return;
    const sp = new URLSearchParams();
    for (const [k, v] of new FormData(form)) {
      if (typeof v === "string" && v.trim()) sp.set(k, v.trim());
    }
    const qs = sp.toString();
    router.push(qs ? `${action}?${qs}` : action, { scroll: false });
  }

  return (
    <form
      ref={ref}
      action={action}
      method="get"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        navigate();
      }}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.type !== "text" && t.type !== "search") navigate();
      }}
    >
      {children}
    </form>
  );
}

export function SearchField({
  defaultValue,
  placeholder = "Search articles, events, places, tags…",
  large,
  autoFocus,
}: {
  defaultValue?: string;
  placeholder?: string;
  large?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <Search
        className={
          large
            ? "pointer-events-none absolute left-0 top-1/2 size-7 -translate-y-1/2 text-muted"
            : "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        }
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search"
        className={
          large
            ? "w-full border-0 border-b-2 border-ink bg-transparent py-4 pl-11 font-display text-3xl outline-none placeholder:text-muted/60 focus:border-brand md:text-5xl"
            : "h-11 w-full border border-line bg-white pl-9 pr-3 text-[15px] outline-none focus:border-ink"
        }
      />
    </div>
  );
}

export const filterSelectClass =
  "select-chevron h-11 w-full appearance-none border border-line bg-white px-3 pr-8 text-[14px] outline-none focus:border-ink";

export const filterLabelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted";
