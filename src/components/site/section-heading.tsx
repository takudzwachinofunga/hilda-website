import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
  className,
  invert,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex items-end justify-between gap-4 border-t-[3px] pt-3 md:mb-10",
        invert ? "border-white" : "border-ink",
        className,
      )}
    >
      <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em]",
            invert ? "text-white hover:text-white/80" : "text-brand hover:text-ink",
          )}
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-white">
      <div className="container-site py-12 md:py-16">
        {kicker && <p className="kicker text-brand">{kicker}</p>}
        <h1 className="headline mt-3 text-5xl md:text-7xl">{title}</h1>
        {description && (
          <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-muted md:text-xl">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
