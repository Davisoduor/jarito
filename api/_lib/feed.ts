// Server side of the feed proxy. Canvas does not send CORS headers, so the
// browser cannot read a calendar feed directly; this fetches it and hands the
// raw ICS back. Parsing stays in the browser (src/lib/canvasIcs.ts) so the
// server never has to understand, or keep, anyone's coursework.
//
// Nothing here logs the feed URL or the body. The URL is a bearer credential:
// anyone holding it can read that student's calendar.

import { feedPlatform, normalizeFeedUrl } from '../../src/lib/canvasIcs.js';

export const MAX_FEED_BYTES = 2 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 20_000;

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Canvas and Brightspace calendar feeds only. The host is not pinned to
 * *.instructure.com or *.brightspace.com, because many schools serve both
 * from their own domain. What stays fixed is the feed path and its exact
 * query shape (see feedPlatform), which is specific enough that this cannot
 * be pointed at an arbitrary page.
 *
 * IP literals and single-label hosts are refused so the function can't be
 * aimed at internal addresses; together with `redirect: "manual"` below that
 * keeps it from being a general-purpose proxy.
 */
export function isAllowedFeed(raw: string): boolean {
  if (!feedPlatform(raw)) return false;
  const url = new URL(normalizeFeedUrl(raw));
  if (url.port) return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.startsWith('[') || IPV4.test(host)) return false;
  return !(host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local'));
}

export class FeedError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const FRESH_LINK = 'Get a fresh link: in Canvas, Calendar then Calendar Feed; in Brightspace, Calendar then Subscribe.';

/** Fetches a feed and returns its text, or throws a FeedError worded for the student. */
export async function fetchFeed(feedUrl: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!isAllowedFeed(feedUrl)) {
    throw new FeedError(
      'That is not a Canvas or Brightspace calendar feed link.',
      400,
    );
  }

  let res: Response;
  try {
    // `redirect: "manual"`: the allow-list checks the URL we request, but a
    // followed redirect could land anywhere and we would return its body.
    res = await fetchImpl(normalizeFeedUrl(feedUrl), {
      headers: { Accept: 'text/calendar', 'User-Agent': 'Jarito (+https://jarito.app)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'manual',
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new FeedError(timedOut ? 'Your school’s system took too long to answer. Try again in a minute.' : 'Could not reach your school’s system. Check the link and try again.', 502);
  }

  if (res.status >= 300 && res.status < 400) {
    throw new FeedError(`Your school redirected the request instead of returning the feed. ${FRESH_LINK}`, 502);
  }
  if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
    throw new FeedError(`Your school no longer recognises this feed link; it may have been reset. ${FRESH_LINK}`, 502);
  }
  if (!res.ok) throw new FeedError(`Your school’s system answered with an error (${res.status}). Try again shortly.`, 502);

  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_FEED_BYTES) throw new FeedError('That calendar is too large to read.', 502);

  const text = await readCapped(res, MAX_FEED_BYTES);
  if (!text.includes('BEGIN:VCALENDAR')) throw new FeedError('That link did not return a calendar.', 502);
  return text;
}

/** Reads a body but stops at `limit` bytes, since Content-Length can be absent or wrong. */
async function readCapped(res: Response, limit: number): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new FeedError('That calendar is too large to read.', 502);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
  return new TextDecoder().decode(merged);
}

/**
 * Best-effort per-IP limit. It lives in one function instance's memory, so it
 * is not global — it only blunts a single client hammering the endpoint. The
 * real limit is the Vercel Firewall rule described in the README.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const t = now();
    const recent = (hits.get(key) ?? []).filter(ts => t - ts < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}
