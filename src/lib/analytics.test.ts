import { stripPrivateUrlParts } from './analytics';

describe('stripPrivateUrlParts', () => {
  it('drops a feed link carried in the fragment', () => {
    const url = 'https://jarito.app/#feed=' + encodeURIComponent('https://s.instructure.com/feeds/calendars/user_abc.ics');
    expect(stripPrivateUrlParts(url)).toBe('https://jarito.app/');
  });

  it('drops imports and query strings but keeps the page', () => {
    expect(stripPrivateUrlParts('https://jarito.app/#import=abc')).toBe('https://jarito.app/');
    expect(stripPrivateUrlParts('https://jarito.app/canvas?utm_source=x')).toBe('https://jarito.app/canvas');
  });
});
