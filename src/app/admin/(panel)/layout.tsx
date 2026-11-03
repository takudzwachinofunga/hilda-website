import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="min-h-dvh bg-paper">
      <AdminSidebar siteName={settings.siteName} email={admin.email} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
