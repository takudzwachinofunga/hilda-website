"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory, saveCategory } from "@/app/admin/actions/categories";
import type { ActionState } from "@/lib/action-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmAction, Panel, SubmitButton } from "@/components/admin/ui";

type Category = { id: string; name: string; slug: string; description: string; count: number };

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Panel className="overflow-hidden">
        <ul className="divide-y divide-line">
          {categories.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">No categories yet.</li>}
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      </Panel>
      <Panel className="self-start p-5">
        <h2 className="font-semibold">Add a category</h2>
        <CategoryForm />
      </Panel>
    </div>
  );
}

function CategoryForm() {
  const [state, action] = useActionState<ActionState, FormData>(saveCategory, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      ref.current?.reset();
    } else if (state.error) toast.error(state.error);
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-4 space-y-3">
      <Input name="name" placeholder="Name" required maxLength={60} />
      <Input name="description" placeholder="Short description (optional)" />
      <SubmitButton className="w-full">Add category</SubmitButton>
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await saveCategory(prev, fd);
    if (result.ok) setEditing(false);
    return result;
  }, {});
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Saved.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form action={action} className="grid gap-2 md:grid-cols-[1fr_1fr_10rem_auto]">
          <input type="hidden" name="id" value={category.id} />
          <Input name="name" defaultValue={category.name} required aria-label="Name" />
          <Input name="description" defaultValue={category.description} placeholder="Description" aria-label="Description" />
          <Input name="slug" defaultValue={category.slug} aria-label="Slug" className="font-mono text-[13px]" />
          <div className="flex gap-1">
            <SubmitButton size="icon" aria-label="Save">
              <Check className="size-4" />
            </SubmitButton>
            <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel">
              <X className="size-4" />
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="font-medium">{category.name}</p>
        <p className="truncate text-[13px] text-muted">
          /{category.slug} · {category.count} {category.count === 1 ? "article" : "articles"}
          {category.description ? ` · ${category.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit">
          <Pencil className="size-4" />
        </Button>
        <ConfirmAction
          action={deleteCategory}
          fields={{ id: category.id }}
          title={`Delete “${category.name}”?`}
          description={
            category.count
              ? `${category.count} article(s) will become uncategorised. They will not be deleted.`
              : "This category is not used by any article."
          }
          variant="ghost"
          size="icon"
          className="text-muted hover:text-brand"
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete</span>
        </ConfirmAction>
      </div>
    </li>
  );
}
