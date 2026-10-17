import { isFeedUrl, normalizeFeedUrl } from '../../src/lib/canvasIcs';

// Finding the feed link on the tab the student already has open, so they
// don't have to dig for it and paste it. Clicking the toolbar icon grants
// activeTab, which lets the popup see that tab's address and run
// findFeedLinkOnPage in it once.

/** The active tab, if it's an ordinary web page the popup could read. */
export async function activeWebTab(): Promise<{ id: number; url: string } | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('https://')) return null;
    if (new URL(tab.url).hostname === 'jarito.app') return null;
    return { id: tab.id, url: tab.url };
  } catch {
    return null;
  }
}

/** Host permission pattern for one origin, e.g. https://sfsu.instructure.com/* */
export function originPattern(url: string): string {
  const { protocol, hostname } = new URL(url);
  return `${protocol}//${hostname}/*`;
}

export async function captureFeedLink(tabId: number): Promise<string | null> {
  // Top frame only. With allFrames, one cross-origin frame we can't touch
  // (Canvas embeds sso.canvaslms.com) fails the whole injection.
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func: findFeedLinkOnPage });
  const link = typeof r?.result === 'string' ? normalizeFeedUrl(r.result) : '';
  return isFeedUrl(link) ? link : null;
}

/**
 * Runs inside the page, so it must be self-contained: Chrome serialises the
 * function and nothing it closes over comes along.
 *
 * Canvas lists the signed-in student's own feed under calendar.ics in the
 * profile API, which the page's session can read. Brightspace has no
 * equivalent, so otherwise this looks for a feed link already on the page
 * (Canvas's Calendar Feed box, Brightspace's Subscribe dialog), including
 * inside same-origin frames.
 */
export async function findFeedLinkOnPage(): Promise<string | null> {
  const FEED = /\/feeds\/calendars\/user_[^/?#]+\.ics|\/d2l\/le\/calendar\/feed\/user\/feed\.ics\?token=/;

  try {
    const res = await fetch('/api/v1/users/self/profile', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      // Canvas guards JSON against hijacking with a while(1); prefix.
      const body = JSON.parse((await res.text()).replace(/^while\(1\);/, ''));
      const ics = body?.calendar?.ics;
      if (typeof ics === 'string' && FEED.test(ics)) return ics;
    }
  } catch { /* not Canvas, or signed out */ }

  const docs: Document[] = [document];
  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    try { if (frame.contentDocument) docs.push(frame.contentDocument); } catch { /* cross-origin */ }
  }
  const values = docs.flatMap(d => [
    ...Array.from(d.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'), e => e.value),
    ...Array.from(d.querySelectorAll<HTMLAnchorElement>('a[href]'), a => a.href),
  ]);
  return values.map(v => v.trim()).find(v => FEED.test(v)) ?? null;
}
