export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Reads a single, length-limited string value from Next.js searchParams. */
export function param(sp: RawSearchParams, key: string) {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 200) || undefined;
}

export function pickParams<K extends string>(sp: RawSearchParams, keys: readonly K[]) {
  return Object.fromEntries(keys.map((k) => [k, param(sp, k)])) as Record<K, string | undefined>;
}

export const NEWS_PARAM_KEYS = [
  "q", "event", "category", "date", "from", "to", "year", "featured", "sort", "page",
] as const;

export const GALLERY_PARAM_KEYS = ["event", "date", "year", "type", "page"] as const;
