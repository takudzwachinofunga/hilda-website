import Link from "next/link";

export function EmptyState({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="border-y border-line py-20 text-center">
      <p className="font-display text-3xl italic md:text-4xl">{title}</p>
      {description && <p className="mx-auto mt-3 max-w-md text-muted">{description}</p>}
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-6 inline-block border border-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] transition hover:bg-ink hover:text-white"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
