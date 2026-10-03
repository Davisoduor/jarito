/**
 * Keeps only origin and path. The fragment can carry a calendar feed link
 * (#feed=, #import=), which is a credential, and nothing in the query string
 * is needed for counting visits.
 */
export function stripPrivateUrlParts(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}
