"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-line bg-white", className)}>{children}</div>;
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1.5 text-[13px] text-brand">{error}</p>;
}

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

/** Shows a toast whenever a server action returns a new message or error. */
export function useActionToast(state: ActionState) {
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);
}

/**
 * A button that asks for confirmation before submitting a server action.
 * `action` receives the hidden fields as FormData.
 */
export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel = "Delete",
  children,
  variant = "destructive",
  size = "sm",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  title: string;
  description?: string;
  confirmLabel?: string;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <form
            action={async (fd) => {
              await action(fd);
              setOpen(false);
            }}
          >
            {Object.entries(fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <SubmitButton variant="destructive">{confirmLabel}</SubmitButton>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function StatusBadge({ status, scheduled }: { status: string; scheduled?: boolean }) {
  const published = status === "PUBLISHED";
  const tone = !published
    ? "bg-amber-50 text-amber-700"
    : scheduled
      ? "bg-sky-50 text-sky-700"
      : "bg-emerald-50 text-emerald-700";
  const dot = !published ? "bg-amber-500" : scheduled ? "bg-sky-500" : "bg-emerald-500";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium", tone)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {!published ? "Draft" : scheduled ? "Scheduled" : "Published"}
    </span>
  );
}

export const nativeSelectClass =
  "select-chevron h-9 w-full appearance-none rounded-md border border-input bg-white px-3 pr-8 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
