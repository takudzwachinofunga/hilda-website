import Link from "next/link";

import { getSettings } from "@/lib/settings";
import { DesktopNav, MobileNav } from "@/components/site/site-nav";

export async function SiteHeader() {
  const settings = await getSettings();
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Harare",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden border-b border-line md:block">
        <div className="container-site flex h-9 items-center justify-between text-[12px] text-muted">
          <span>{today}</span>
          <span>
            {settings.authorName}
            {settings.location ? ` · ${settings.location}` : ""}
          </span>
        </div>
      </div>
      <div className="border-b border-ink/90">
        <div className="container-site flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="group flex items-center gap-3" aria-label={`${settings.siteName} home`}>
            <span aria-hidden className="block h-7 w-1.5 bg-brand transition-all group-hover:h-9 md:h-9" />
            <span className="font-display text-[22px] font-semibold leading-none tracking-tight md:text-[30px]">
              {settings.siteName}
            </span>
          </Link>
          <DesktopNav />
          <MobileNav siteName={settings.siteName} />
        </div>
      </div>
    </header>
  );
}
