"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { Trash2 } from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

function FigureView({ node, updateAttributes, deleteNode, selected, editor }: ReactNodeViewProps) {
  const { src, alt, caption } = node.attrs as { src: string; alt: string; caption: string };
  return (
    <NodeViewWrapper as="figure" className={selected ? "is-selected" : undefined} data-drag-handle>
      <div className="group relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- editor preview */}
        <img src={src} alt={alt} draggable={false} />
        {editor.isEditable && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white opacity-0 transition hover:bg-brand group-hover:opacity-100 focus:opacity-100"
            aria-label="Remove image"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <input
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value, alt: alt || e.target.value })}
        placeholder="Add a caption…"
        className="mt-2 w-full border-0 bg-transparent text-center text-[14px] text-muted outline-none placeholder:text-muted/60"
        // Keep keystrokes inside the input from being handled by ProseMirror.
        onKeyDown={(e) => e.stopPropagation()}
      />
    </NodeViewWrapper>
  );
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => {
          const element = el as HTMLElement;
          const img = element.querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: element.querySelector("figcaption")?.textContent ?? img.getAttribute("data-caption") ?? "",
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (el) => {
          const img = el as HTMLElement;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: img.getAttribute("data-caption") ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption } = HTMLAttributes as { src: string; alt: string; caption: string };
    const img = ["img", mergeAttributes({ src, alt: alt || caption || "", "data-caption": caption || null })];
    return caption
      ? ["figure", { "data-type": "figure" }, img, ["figcaption", {}, caption]]
      : ["figure", { "data-type": "figure" }, img];
  },

  addCommands() {
    return {
      insertFigure:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});
