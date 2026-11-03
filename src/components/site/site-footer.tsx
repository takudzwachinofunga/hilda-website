import Link from "next/link";

import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { NAV_LINKS } from "@/lib/nav";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    db.category.findMany({
      where: { articles: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      take: 8,
      select: { name: true, slug: true },
    }),
  ]);
  const socials = [
    ["X / Twitter", settings.twitterUrl],
    ["Facebook", settings.facebookUrl],
    ["Instagram", settings.instagramUrl],
    ["YouTube", settings.youtubeUrl],
    ["LinkedIn", settings.linkedinUrl],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <footer className="mt-24 border-t-4 border-brand bg-ink text-white">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-8 w-1.5 bg-brand" />
            <span className="font-display text-3xl font-semibold">{settings.siteName}</span>
          </div>
          {settings.tagline && (
            <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-white/70">{settings.tagline}</p>
          )}
          <p className="mt-6 text-sm text-white/50">
            Independent reporting by {settings.authorName}
            {settings.location ? `, ${settings.location}` : ""}.
          </p>
        </div>
        <div className="md:col-span-2">
          <h2 className="kicker text-white/50">Sections</h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/85 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="text-white/85 hover:text-white">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="kicker text-white/50">Topics</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[15px] md:grid-cols-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/news?category=${c.slug}`} className="text-white/85 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h2 className="kicker text-white/50">Contact</h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {settings.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="break-all text-white/85 hover:text-white">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {socials.map(([label, href]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-[13px] text-white/45 md:flex-row md:justify-between">
          <span>
            © {new Date().getFullYear()} {settings.authorName}. All rights reserved.
          </span>
          <span>Text, photographs and video may not be reproduced without permission.</span>
        </div>
      </div>
    </footer>
  );
}
