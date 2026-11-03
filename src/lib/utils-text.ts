import slugifyLib from "slugify";

export function slugify(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true }).slice(0, 96) || "untitled";
}

export function formatDate(date: Date | string | null | undefined, style: "long" | "short" = "long") {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "Africa/Harare",
  }).format(d);
}

export function formatDateRange(start: Date, end?: Date | null) {
  if (!end || end.toDateString() === start.toDateString()) return formatDate(start);
  return `${formatDate(start, "short")} – ${formatDate(end, "short")}`;
}

/** Converts a Date to the value expected by <input type="date">. */
export function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/** Parses a yyyy-mm-dd string into a Date at midday UTC (avoids TZ drift). */
export function parseDateInput(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTime(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length).replace(/\s+\S*$/, "") + "…";
}

export function str(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(value: FormDataEntryValue | null | undefined) {
  const s = str(value);
  return s.length ? s : null;
}
