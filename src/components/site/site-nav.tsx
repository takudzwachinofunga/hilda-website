"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "relative py-1 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-brand",
            "after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[2px] after:origin-left after:scale-x-0 after:bg-brand after:transition-transform hover:after:scale-x-100",
            isActive(pathname, link.href) && "text-brand after:scale-x-100",
          )}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/search"
        aria-label="Search"
        className={cn(
          "inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-brand",
          isActive(pathname, "/search") && "text-brand",
        )}
      >
        <Search className="size-4" /> Search
      </Link>
    </nav>
  );
}

export function MobileNav({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex items-center gap-1 md:hidden">
      <Link href="/search" aria-label="Search" className="p-2">
        <Search className="size-5" />
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2"
      >
        <Menu className="size-6" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-white transition-[opacity,visibility] duration-300",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <span className="font-display text-xl font-semibold">{siteName}</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
            <X className="size-6" />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex flex-col px-4 pt-6">
          {[...NAV_LINKS, { href: "/search", label: "Search" }].map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              tabIndex={open ? 0 : -1}
              className={cn(
                "flex items-baseline gap-4 border-b border-line py-4 font-display text-4xl transition-colors",
                isActive(pathname, link.href) ? "text-brand" : "text-ink",
              )}
            >
              <span className="font-sans text-xs tabular-nums text-muted">0{i + 1}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
