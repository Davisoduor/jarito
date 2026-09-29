import { buildHandoffUrl, readFeedFromHash } from './handoff';

const FEED = 'https://sfsu.instructure.com/feeds/calendars/user_AbC123.ics';

describe('phone handoff', () => {
  it('round-trips a feed URL through the fragment', () => {
    const link = buildHandoffUrl('https://jarito.app', FEED);
    expect(link.startsWith('https://jarito.app/#feed=')).toBe(true);
    expect(readFeedFromHash(new URL(link).hash)).toBe(FEED);
  });

  it('ignores fragments that are not a Canvas feed', () => {
    expect(readFeedFromHash('')).toBeNull();
    expect(readFeedFromHash('#top')).toBeNull();
    expect(readFeedFromHash('#feed=' + encodeURIComponent('https://evil.example/x'))).toBeNull();
    expect(readFeedFromHash('#feed=%E0%A4%A')).toBeNull();
  });
});
