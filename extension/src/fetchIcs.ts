import { fetchFeed } from '../../api/_lib/feed';
import { originPattern } from './capture';

// The web app reads feeds through /api/feed because Canvas and Brightspace
// send no CORS headers. An extension with host permission for the school can
// read the feed itself, so here the link never leaves the student's browser.
// It runs the same checks the proxy does (allow-list, no redirects, 2 MB cap).

export async function fetchIcs(feedUrl: string, interactive: boolean): Promise<string> {
  if (interactive) {
    const origins = [originPattern(feedUrl)];
    let granted = false;
    try {
      // Chrome only shows the prompt during a user gesture, so this has to be
      // the first await after a click. Already granted resolves without one.
      granted = await chrome.permissions.request({ origins });
    } catch {
      // Not in a gesture any more (the link came from the open tab, after
      // the click had been spent on asking for that tab's host).
      granted = await chrome.permissions.contains({ origins }).catch(() => false);
    }
    if (!granted) {
      throw new Error(`Jarito needs your OK to read your calendar from ${new URL(feedUrl).hostname}. Press Start watching and choose Allow.`);
    }
  }
  return fetchFeed(feedUrl);
}
