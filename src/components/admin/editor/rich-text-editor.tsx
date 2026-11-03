"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
  Unlink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MediaPicker } from "@/components/admin/media-picker";
import { Figure } from "@/components/admin/editor/figure-extension";

export function RichTextEditor({
  name,
  defaultValue,
  eventId,
  invalid,
}: {
  name: string;
  defaultValue: string;
  eventId?: string | null;
  invalid?: boolean;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Write your story…" }),
      Figure,
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: {
        class: "article-prose min-h-[420px] px-5 py-6 outline-none md:px-10 md:py-10",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-white",
        invalid ? "border-brand" : "border-line",
      )}
    >
      <input type="hidden" name={name} value={html} />
      {editor && <Toolbar editor={editor} onInsertImage={() => setPickerOpen(true)} />}
      <EditorContent editor={editor} />
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        eventId={eventId}
        title="Insert images into the article"
        onSelect={(items) => {
          if (!editor) return;
          let chain = editor.chain().focus();
          for (const item of items) {
            chain = chain.insertFigure({
              src: item.url,
              alt: item.caption ?? "",
              caption: item.caption ?? "",
            });
          }
          chain.run();
        }}
      />
    </div>
  );
}

function Toolbar({ editor, onInsertImage }: { editor: Editor; onInsertImage: () => void }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const applyLink = () => {
    const value = url.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:|mailto:)/i.test(value) ? value : `https://${value}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  const btn = (active: boolean | undefined, label: string, onClick: () => void, Icon: typeof Bold, disabled?: boolean) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded transition-colors disabled:opacity-30",
        active ? "bg-ink text-white" : "text-ink/75 hover:bg-paper hover:text-ink",
      )}
    >
      <Icon className="size-4" />
    </button>
  );

  return (
    <div className="sticky top-14 z-10 border-b border-line bg-white/95 backdrop-blur lg:top-0">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        {btn(state.h2, "Heading", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2)}
        {btn(state.h3, "Subheading", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3)}
        <span className="mx-1 h-5 w-px bg-line" />
        {btn(state.bold, "Bold", () => editor.chain().focus().toggleBold().run(), Bold)}
        {btn(state.italic, "Italic", () => editor.chain().focus().toggleItalic().run(), Italic)}
        {btn(state.link, "Link", () => {
          setUrl(editor.getAttributes("link").href ?? "");
          setLinkOpen((o) => !o);
        }, Link2)}
        {state.link && btn(false, "Remove link", () => editor.chain().focus().unsetLink().run(), Unlink)}
        <span className="mx-1 h-5 w-px bg-line" />
        {btn(state.bullet, "Bulleted list", () => editor.chain().focus().toggleBulletList().run(), List)}
        {btn(state.ordered, "Numbered list", () => editor.chain().focus().toggleOrderedList().run(), ListOrdered)}
        {btn(state.quote, "Quote", () => editor.chain().focus().toggleBlockquote().run(), Quote)}
        {btn(false, "Divider", () => editor.chain().focus().setHorizontalRule().run(), Minus)}
        <span className="mx-1 h-5 w-px bg-line" />
        {btn(false, "Insert image", onInsertImage, ImagePlus)}
        <span className="ml-auto" />
        {btn(false, "Undo", () => editor.chain().focus().undo().run(), Undo2, !state.canUndo)}
        {btn(false, "Redo", () => editor.chain().focus().redo().run(), Redo2, !state.canRedo)}
      </div>
      {linkOpen && (
        <div className="flex items-center gap-2 border-t border-line px-3 py-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="https://example.com"
            className="h-8 flex-1 rounded border border-line px-2 text-sm outline-none focus:border-ink"
          />
          <button type="button" onClick={applyLink} className="h-8 rounded bg-ink px-3 text-sm text-white">
            Apply
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-8 px-2 text-sm text-muted">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
