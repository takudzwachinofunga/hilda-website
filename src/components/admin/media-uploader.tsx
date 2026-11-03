"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";

import { registerUpload, type MediaItemDTO } from "@/app/admin/actions/media";
import { cn } from "@/lib/utils";

const LIMITS = {
  image: { maxBytes: 10 * 1024 * 1024, exts: ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic"] },
  video: { maxBytes: 100 * 1024 * 1024, exts: ["mp4", "mov", "webm", "m4v"] },
} as const;

type Job = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "verifying" | "done" | "error";
  error?: string;
};

type Signature = {
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  apiKey: string;
  uploadUrl: string;
};

function detectType(file: File): "image" | "video" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") || (LIMITS.image.exts as readonly string[]).includes(ext)) return "image";
  if (file.type.startsWith("video/") || (LIMITS.video.exts as readonly string[]).includes(ext)) return "video";
  return null;
}

function uploadWithProgress(url: string, body: FormData, onProgress: (pct: number) => void) {
  return new Promise<{ public_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json?.error?.message ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

export function MediaUploader({
  accept = "both",
  eventId,
  onUploaded,
  compact,
}: {
  accept?: "image" | "video" | "both";
  eventId?: string | null;
  onUploaded?: (media: MediaItemDTO) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);

  const update = (id: string, patch: Partial<Job>) =>
    setJobs((all) => all.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const uploadOne = useCallback(
    async (file: File) => {
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      setJobs((all) => [{ id, name: file.name, progress: 0, status: "uploading" }, ...all]);

      const type = detectType(file);
      if (!type || (accept !== "both" && type !== accept)) {
        update(id, { status: "error", error: "Unsupported file type." });
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!(LIMITS[type].exts as readonly string[]).includes(ext)) {
        update(id, { status: "error", error: `.${ext} files are not allowed.` });
        return;
      }
      if (file.size > LIMITS[type].maxBytes) {
        update(id, {
          status: "error",
          error: `Too large (max ${LIMITS[type].maxBytes / 1024 / 1024} MB).`,
        });
        return;
      }

      try {
        const sigRes = await fetch("/api/admin/upload-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceType: type, fileSize: file.size, fileType: file.type || undefined }),
        });
        const sig = (await sigRes.json()) as Signature & { error?: string };
        if (!sigRes.ok) throw new Error(sig.error ?? "Could not authorise upload.");

        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", String(sig.timestamp));
        body.append("signature", sig.signature);
        body.append("folder", sig.folder);
        body.append("allowed_formats", sig.allowed_formats);

        const uploaded = await uploadWithProgress(sig.uploadUrl, body, (p) => update(id, { progress: p }));
        update(id, { status: "verifying", progress: 100 });

        const result = await registerUpload({
          publicId: uploaded.public_id,
          resourceType: type,
          eventId: eventId ?? null,
        });
        if (!result.ok) throw new Error(result.error);
        update(id, { status: "done" });
        onUploaded?.(result.media);
      } catch (err) {
        update(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    },
    [accept, eventId, onUploaded],
  );

  const handleFiles = (files: FileList | File[]) => {
    // Upload up to three at a time.
    const list = Array.from(files);
    let cursor = 0;
    const worker = async () => {
      while (cursor < list.length) {
        const file = list[cursor++];
        await uploadOne(file);
      }
    };
    void Promise.all([worker(), worker(), worker()]);
  };

  const acceptAttr =
    accept === "image" ? "image/*,.heic" : accept === "video" ? "video/*" : "image/*,video/*,.heic";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition",
          compact ? "px-4 py-6" : "px-6 py-12",
          dragging ? "border-brand bg-brand/5" : "border-line bg-white hover:border-ink/30",
        )}
      >
        <UploadCloud className="size-8 text-brand" />
        <p className="mt-3 font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-[13px] text-muted">
          {accept !== "video" && "Photos: JPG, PNG, WebP, HEIC up to 10 MB. "}
          {accept !== "image" && "Videos: MP4, MOV, WebM up to 100 MB."}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttr}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{j.name}</span>
                {j.status === "done" && <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />}
                {j.status === "error" && <AlertCircle className="size-4 shrink-0 text-brand" />}
                {(j.status === "uploading" || j.status === "verifying") && (
                  <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted">
                    <Loader2 className="size-3.5 animate-spin" />
                    {j.status === "verifying" ? "Verifying" : `${j.progress}%`}
                  </span>
                )}
              </div>
              {j.status === "uploading" && (
                <div className="mt-2 h-1 overflow-hidden rounded bg-paper">
                  <div className="h-full bg-brand transition-all" style={{ width: `${j.progress}%` }} />
                </div>
              )}
              {j.error && <p className="mt-1 text-[12px] text-brand">{j.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
