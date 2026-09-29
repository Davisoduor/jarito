import { FeedError, createRateLimiter, fetchFeed } from './_lib/feed.js';

const allow = createRateLimiter(30, 60_000);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!allow(ip)) return json({ error: 'Too many syncs in a short time. Wait a minute and try again.' }, 429);

  let feedUrl: unknown;
  try {
    ({ feedUrl } = await request.json());
  } catch {
    return json({ error: 'Send JSON with a feedUrl.' }, 400);
  }
  if (typeof feedUrl !== 'string' || !feedUrl.trim()) return json({ error: 'Paste your Canvas feed link first.' }, 400);

  try {
    const ics = await fetchFeed(feedUrl);
    return json({ ics, fetchedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof FeedError) return json({ error: err.message }, err.status);
    return json({ error: 'Something went wrong reading the feed. Try again.' }, 500);
  }
}
