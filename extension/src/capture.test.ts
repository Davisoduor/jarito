import { findFeedLinkOnPage, originPattern } from './capture';

const FEED = 'https://sfsu.instructure.com/feeds/calendars/user_abc123.ics';
const D2L = 'https://school.brightspace.com/d2l/le/calendar/feed/user/feed.ics?token=xyz';

const respond = (status: number, body: string) =>
  vi.fn().mockResolvedValue(new Response(body, { status }));

describe('findFeedLinkOnPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('reads the feed from the Canvas profile API, past the while(1); guard', async () => {
    vi.stubGlobal('fetch', respond(200, `while(1);${JSON.stringify({ name: 'S', calendar: { ics: FEED } })}`));
    expect(await findFeedLinkOnPage()).toBe(FEED);
  });

  it('falls back to a feed link showing on the page', async () => {
    vi.stubGlobal('fetch', respond(404, 'Not found'));
    document.body.innerHTML = `<input value="nothing"><input value=" ${D2L} ">`;
    expect(await findFeedLinkOnPage()).toBe(D2L);
  });

  it('looks inside same-origin frames', async () => {
    vi.stubGlobal('fetch', respond(404, 'Not found'));
    document.body.innerHTML = '<iframe></iframe>';
    document.querySelector('iframe')!.contentDocument!.body.innerHTML = `<input value="${D2L}">`;
    expect(await findFeedLinkOnPage()).toBe(D2L);
  });

  it('ignores a profile without a feed and pages without one', async () => {
    vi.stubGlobal('fetch', respond(200, JSON.stringify({ calendar: { ics: 'https://evil.example/x' } })));
    document.body.innerHTML = '<a href="https://sfsu.instructure.com/calendar">Calendar</a>';
    expect(await findFeedLinkOnPage()).toBeNull();
  });

  it('survives a fetch that throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    expect(await findFeedLinkOnPage()).toBeNull();
  });
});

describe('originPattern', () => {
  it('covers just the one host', () => {
    expect(originPattern(FEED)).toBe('https://sfsu.instructure.com/*');
  });
});
