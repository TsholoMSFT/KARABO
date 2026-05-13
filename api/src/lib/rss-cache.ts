import type { RSSItem } from "./xml-utils";

// Stale-while-revalidate in-memory cache for live RSS results.
// - Fresh window: serve directly, no upstream call.
// - Stale window: serve cached value, kick off async refresh.
// - Beyond stale window with no cache: wait for live fetch.
// - Live fetch failure with any prior cache: serve cache as last resort.
// Concurrent requests for the same company share one in-flight fetch.

const FRESH_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 60 * 60 * 1000;

interface Entry {
  items: RSSItem[];
  fetchedAt: number;
}

interface CtxLike {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export type CacheSource = "fresh" | "stale" | "live" | "none";

export interface CacheResult {
  items: RSSItem[];
  source: CacheSource;
  ageMs?: number;
  message?: string;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<RSSItem[]>>();

const keyOf = (company: string) => company.trim().toLowerCase();

function dedupedFetch(
  key: string,
  company: string,
  fetcher: (c: string) => Promise<RSSItem[]>
): Promise<RSSItem[]> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = fetcher(company)
    .then((items) => {
      cache.set(key, { items, fetchedAt: Date.now() });
      return items;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

function revalidate(
  key: string,
  company: string,
  fetcher: (c: string) => Promise<RSSItem[]>,
  context: CtxLike
): void {
  if (inflight.has(key)) return;
  dedupedFetch(key, company, fetcher).catch((err: any) => {
    context.warn(
      `RSS background revalidation failed for "${company}": ${err?.message ?? "unknown"}`
    );
  });
}

export async function getOrFetchRSS(
  company: string,
  fetcher: (c: string) => Promise<RSSItem[]>,
  context: CtxLike
): Promise<CacheResult> {
  const key = keyOf(company);
  if (!key) return { items: [], source: "none" };

  const now = Date.now();
  const entry = cache.get(key);

  if (entry && now - entry.fetchedAt < FRESH_TTL_MS) {
    return { items: entry.items, source: "fresh", ageMs: now - entry.fetchedAt };
  }

  if (entry && now - entry.fetchedAt < STALE_TTL_MS) {
    revalidate(key, company, fetcher, context);
    return { items: entry.items, source: "stale", ageMs: now - entry.fetchedAt };
  }

  try {
    const items = await dedupedFetch(key, company, fetcher);
    return { items, source: "live", ageMs: 0 };
  } catch (err: any) {
    if (entry) {
      context.warn(
        `Live RSS fetch failed for "${company}", serving expired cache: ${err?.message ?? "unknown"}`
      );
      return {
        items: entry.items,
        source: "stale",
        ageMs: now - entry.fetchedAt,
        message: `Live RSS unavailable; showing cached results from ${new Date(
          entry.fetchedAt
        ).toISOString()}`,
      };
    }
    return {
      items: [],
      source: "none",
      message: `Live RSS fetch failed: ${err?.message ?? "unknown"}`,
    };
  }
}

// For tests / admin endpoints
export function _clearRSSCache(): void {
  cache.clear();
  inflight.clear();
}
