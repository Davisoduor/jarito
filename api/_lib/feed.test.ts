import { describe, it, expect } from 'vitest';
import { isAllowedFeed, fetchFeed, createRateLimiter, FeedError, MAX_FEED_BYTES } from './feed';

const GOOD = 'https://sfsu.instructure.com/feeds/calendars/user_AbC123.ics';
const ICS = 'BEGIN:VCALENDAR\nEND:VCALENDAR\n';

const stub = (res: Response) => (async () => res) as unknown as typeof fetch;

describe('isAllowedFeed', () => {
  it('accepts Instructure-hosted and school-hosted Canvas feeds', () => {
    expect(isAllowedFeed(GOOD)).toBe(true);
    expect(isAllowedFeed('https://canvas.school.edu/feeds/calendars/user_Xy9.ics')).toBe(true);
  });

  it('refuses anything that is not a feed path over https', () => {
    expect(isAllowedFeed('http://sfsu.instructure.com/feeds/calendars/user_x.ics')).toBe(false);
    expect(isAllowedFeed('https://sfsu.instructure.com/courses/1')).toBe(false);
    expect(isAllowedFeed('https://example.com/evil.ics')).toBe(false);
    expect(isAllowedFeed('not a url')).toBe(false);
  });

  it('refuses internal-looking hosts, ports, credentials and query strings', () => {
    expect(isAllowedFeed('https://169.254.169.254/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed('https://[::1]/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed('https://localhost/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed('https://intranet/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed('https://a.instructure.com:8443/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed('https://u:p@a.instructure.com/feeds/calendars/user_a.ics')).toBe(false);
    expect(isAllowedFeed(`${GOOD}?x=1`)).toBe(false);
  });
});

describe('fetchFeed', () => {
  it('returns the calendar text', async () => {
    await expect(fetchFeed(GOOD, stub(new Response(ICS)))).resolves.toContain('BEGIN:VCALENDAR');
  });

  it('rejects a disallowed URL before fetching', async () => {
    let called = false;
    const spy = (async () => { called = true; return new Response(ICS); }) as unknown as typeof fetch;
    await expect(fetchFeed('https://example.com/x', spy)).rejects.toMatchObject({ status: 400 });
    expect(called).toBe(false);
  });

  it('does not follow redirects', async () => {
    const res = new Response(null, { status: 302, headers: { Location: 'https://evil.example/' } });
    await expect(fetchFeed(GOOD, stub(res))).rejects.toThrow(/redirected/);
  });

  it('explains a reset feed link', async () => {
    await expect(fetchFeed(GOOD, stub(new Response('', { status: 404 })))).rejects.toThrow(/reset/);
  });

  it('refuses a body that is not a calendar', async () => {
    await expect(fetchFeed(GOOD, stub(new Response('<html></html>')))).rejects.toThrow(/did not return a calendar/);
  });

  it('stops reading past the size cap even without Content-Length', async () => {
    const big = new ReadableStream<Uint8Array>({
      start(c) {
        const chunk = new Uint8Array(512 * 1024).fill(65);
        for (let i = 0; i < 5; i++) c.enqueue(chunk);
        c.close();
      },
    });
    const err = await fetchFeed(GOOD, stub(new Response(big))).catch(e => e);
    expect(err).toBeInstanceOf(FeedError);
    expect(err.message).toMatch(/too large/);
    expect(MAX_FEED_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit per window, per key', () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect(allow('a')).toBe(true);
    expect(allow('a')).toBe(true);
    expect(allow('a')).toBe(false);
    expect(allow('b')).toBe(true);
    t = 1001;
    expect(allow('a')).toBe(true);
  });
});
