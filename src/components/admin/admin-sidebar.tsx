"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tags,
  X,
} from "lucide-react";

import { logout } from "@/app/admin/actions/auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/media", label: "Media Library", icon: Images },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className={cn("size-[18px]", active && "text-[#ff4d63]")} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] text-white/65 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-[18px]" /> View website
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] text-white/65 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-[18px]" /> Logout
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AdminSidebar({ siteName, email }: { siteName: string; email: string }) {
  const [open, setOpen] = useState(false);
  const brand = (
    <div className="flex items-center gap-2.5 px-6 py-5">
      <span className="block h-6 w-1 bg-brand" />
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-semibold leading-tight text-white">{siteName}</p>
        <p className="truncate text-[11px] text-white/45">{email}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink lg:flex">
        {brand}
        <NavList />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <span className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="block h-5 w-1 bg-brand" /> {siteName}
        </span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="p-2">
          <Menu className="size-5" />
        </button>
      </div>
      <div
        className={cn("fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between pr-3">
          {brand}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 text-white">
            <X className="size-5" />
          </button>
        </div>
        <NavList onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
