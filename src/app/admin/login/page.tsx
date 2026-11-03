import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentAdmin()) redirect("/admin");
  const [{ next }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="block h-9 w-1.5 bg-brand" />
          <span className="font-display text-3xl font-semibold">{settings.siteName}</span>
        </div>
        <blockquote className="max-w-md font-serif text-2xl leading-relaxed text-white/80">
          “{settings.tagline}”
        </blockquote>
        <p className="text-sm text-white/40">Private publishing desk</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="block h-7 w-1.5 bg-brand" />
            <span className="font-display text-2xl font-semibold">{settings.siteName}</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-muted">Access the publishing dashboard.</p>
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
      </div>
    </div>
  );
}
