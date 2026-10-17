import { fetchFeed } from '../../api/_lib/feed';

// The web app reads feeds through /api/feed because Canvas and Brightspace
// send no CORS headers. An extension with host permission for the school can
// read the feed itself, so here the link never leaves the student's browser.
// It runs the same checks the proxy does (allow-list, no redirects, 2 MB cap).

/** Host permission for just the feed's own origin, e.g. https://sfsu.instructure.com/* */
export function feedOrigin(feedUrl: string): string {
  const { protocol, hostname } = new URL(feedUrl);
  return `${protocol}//${hostname}/*`;
}

export async function fetchIcs(feedUrl: string, interactive: boolean): Promise<string> {
  if (interactive) {
    // Chrome only shows the permission prompt during a user gesture, so this
    // has to be the first await after the click. Already granted resolves
    // straight away without a prompt.
    let granted = false;
    try { granted = await chrome.permissions.request({ origins: [feedOrigin(feedUrl)] }); } catch { /* not a feed URL */ }
    if (!granted) {
      throw new Error(`Jarito needs your OK to read your calendar from ${new URL(feedUrl).hostname}. Press Start watching and choose Allow.`);
    }
  }
  return fetchFeed(feedUrl);
}
