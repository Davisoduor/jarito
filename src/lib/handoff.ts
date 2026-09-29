import { isFeedUrl } from './canvasIcs';

// Moving to another device without retyping a 70-character link. The feed URL
// rides in the fragment (#feed=...), which browsers never send to a server, so
// it reaches the new device without passing through Vercel's logs. The app
// reads it once, saves it locally, and strips it from the address bar.

export function buildHandoffUrl(origin: string, feedUrl: string): string {
  return `${origin}/#feed=${encodeURIComponent(feedUrl)}`;
}

export function readFeedFromHash(hash: string): string | null {
  const match = /^#feed=(.+)$/.exec(hash);
  if (!match) return null;
  let url: string;
  try {
    url = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  return isFeedUrl(url) ? url : null;
}
