import { buildMoveUrl, readImport } from './migrate';

const FEED = 'https://sfsu.instructure.com/feeds/calendars/user_AbC123.ics';

describe('moving to jarito.app', () => {
  it('carries the feed and ticks through the fragment', () => {
    const url = buildMoveUrl(JSON.stringify({ feedUrl: FEED, status: { a: 'Done', b: 'In Progress' } }));
    expect(url.startsWith('https://jarito.app/#import=')).toBe(true);
    expect(readImport(new URL(url).hash)).toEqual({ feedUrl: FEED, status: { a: 'Done', b: 'In Progress' } });
  });

  it('just moves visitors with nothing saved, keeping the page', () => {
    expect(buildMoveUrl(null, '/canvas')).toBe('https://jarito.app/canvas');
    expect(buildMoveUrl('not json')).toBe('https://jarito.app/');
    expect(buildMoveUrl(JSON.stringify({ feedUrl: 'demo' }))).toBe('https://jarito.app/');
  });

  it('rejects tampered imports', () => {
    expect(readImport('#import=!!!')).toBeNull();
    const bad = buildMoveUrl(JSON.stringify({ feedUrl: FEED, status: { a: 'Hacked' } }));
    expect(readImport(new URL(bad).hash)?.status).toEqual({});
    expect(readImport('#feed=x')).toBeNull();
  });
});
