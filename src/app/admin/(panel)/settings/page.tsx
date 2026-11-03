import type { Metadata } from "next";

import { getSettings } from "@/lib/settings";
import { isCloudinaryConfigured, UPLOAD_FOLDER } from "@/lib/cloudinary";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { PasswordForm, SettingsForm } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <>
      <AdminPageHeader title="Settings" description="Branding, author details and account security." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <SettingsForm
          settings={{
            siteName: s.siteName,
            tagline: s.tagline,
            authorName: s.authorName,
            authorBio: s.authorBio,
            authorPhoto: s.authorPhoto ?? "",
            contactEmail: s.contactEmail ?? "",
            location: s.location ?? "",
            twitterUrl: s.twitterUrl ?? "",
            facebookUrl: s.facebookUrl ?? "",
            instagramUrl: s.instagramUrl ?? "",
            youtubeUrl: s.youtubeUrl ?? "",
            linkedinUrl: s.linkedinUrl ?? "",
          }}
        />
        <div className="space-y-6">
          <PasswordForm />
          <Panel className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold">Media storage</h2>
            <p className="text-muted">
              Cloudinary:{" "}
              {isCloudinaryConfigured() ? (
                <span className="font-medium text-emerald-700">Connected</span>
              ) : (
                <span className="font-medium text-amber-700">Not configured</span>
              )}
            </p>
            <p className="text-muted">
              Upload folder: <code className="text-ink">{UPLOAD_FOLDER}</code>
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
