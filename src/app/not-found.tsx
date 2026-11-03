import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <p className="font-display text-[7rem] font-semibold leading-none text-brand md:text-[10rem]">404</p>
      <h1 className="headline mt-4 text-3xl md:text-4xl">This page could not be found.</h1>
      <p className="mt-3 max-w-md text-muted">
        The story may have been moved, unpublished, or the link may be mistyped.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="bg-ink px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-brand">
          Home
        </Link>
        <Link
          href="/news"
          className="border border-ink px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] hover:bg-ink hover:text-white"
        >
          All news
        </Link>
      </div>
    </div>
  );
}
