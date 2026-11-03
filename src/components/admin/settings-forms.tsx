"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { changePassword, saveSettings } from "@/app/admin/actions/settings";
import type { ActionState } from "@/lib/action-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, Panel, SubmitButton, useActionToast } from "@/components/admin/ui";

type Settings = Record<
  | "siteName"
  | "tagline"
  | "authorName"
  | "authorBio"
  | "authorPhoto"
  | "contactEmail"
  | "location"
  | "twitterUrl"
  | "facebookUrl"
  | "instagramUrl"
  | "youtubeUrl"
  | "linkedinUrl",
  string
>;

function Field({
  name,
  label,
  defaultValue,
  error,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1.5 block text-[13px]">
        {label}
      </Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} aria-invalid={Boolean(error)} />
      <FieldError error={error} />
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettings, {});
  useActionToast(state);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6">
      <Panel className="space-y-4 p-5">
        <h2 className="font-semibold">Publication</h2>
        <Field name="siteName" label="Website name" defaultValue={settings.siteName} error={fe.siteName} />
        <div>
          <Label htmlFor="tagline" className="mb-1.5 block text-[13px]">
            Tagline
          </Label>
          <Textarea id="tagline" name="tagline" defaultValue={settings.tagline} rows={2} />
          <p className="mt-1 text-[12px] text-muted">Used in the footer and as the default search-engine description.</p>
        </div>
        <Field name="location" label="Base location" defaultValue={settings.location} placeholder="Harare, Zimbabwe" />
      </Panel>

      <Panel className="space-y-4 p-5">
        <h2 className="font-semibold">Author</h2>
        <Field name="authorName" label="Byline name" defaultValue={settings.authorName} error={fe.authorName} />
        <div>
          <Label htmlFor="authorBio" className="mb-1.5 block text-[13px]">
            Short biography
          </Label>
          <Textarea id="authorBio" name="authorBio" defaultValue={settings.authorBio} rows={3} />
        </div>
        <Field name="authorPhoto" label="Portrait URL" defaultValue={settings.authorPhoto} error={fe.authorPhoto} placeholder="https://…" />
        <Field name="contactEmail" label="Public contact email" type="email" defaultValue={settings.contactEmail} />
      </Panel>

      <Panel className="grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Social links</h2>
        <Field name="twitterUrl" label="X / Twitter" defaultValue={settings.twitterUrl} error={fe.twitterUrl} placeholder="https://x.com/…" />
        <Field name="facebookUrl" label="Facebook" defaultValue={settings.facebookUrl} error={fe.facebookUrl} placeholder="https://facebook.com/…" />
        <Field name="instagramUrl" label="Instagram" defaultValue={settings.instagramUrl} error={fe.instagramUrl} placeholder="https://instagram.com/…" />
        <Field name="youtubeUrl" label="YouTube" defaultValue={settings.youtubeUrl} error={fe.youtubeUrl} placeholder="https://youtube.com/@…" />
        <Field name="linkedinUrl" label="LinkedIn" defaultValue={settings.linkedinUrl} error={fe.linkedinUrl} placeholder="https://linkedin.com/in/…" />
      </Panel>

      <div className="flex justify-end">
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePassword, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Password updated.");
      ref.current?.reset();
    } else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Panel className="p-5">
      <h2 className="font-semibold">Change password</h2>
      <form ref={ref} action={action} className="mt-4 space-y-3">
        <Input name="currentPassword" type="password" placeholder="Current password" autoComplete="current-password" required />
        <Input name="newPassword" type="password" placeholder="New password (10+ characters)" autoComplete="new-password" minLength={10} required />
        <Input name="confirmPassword" type="password" placeholder="Confirm new password" autoComplete="new-password" required />
        {state.error && <p className="text-[13px] text-brand">{state.error}</p>}
        <SubmitButton variant="outline" className="w-full">
          Update password
        </SubmitButton>
      </form>
    </Panel>
  );
}
