import { isFeedUrl } from './canvasIcs';
import type { CourseworkStatus } from './types';

// Moving from jarito.vercel.app to jarito.app.
//
// localStorage belongs to one origin, so students who set Jarito up on the old
// address would arrive at the new one with nothing saved. The old address
// therefore forwards to the new one carrying the feed link and ticks in the
// URL fragment (#import=…), which browsers never send to a server — the same
// route the "Open on my phone" QR code uses.

export const CANONICAL_ORIGIN = 'https://jarito.app';
export const OLD_HOSTS = ['jarito.vercel.app'];

const STATUSES: CourseworkStatus[] = ['Open', 'In Progress', 'Done'];

interface Carried {
  feedUrl: string;
  status: Record<string, CourseworkStatus>;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(data: string): string {
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/** Where the old address should send this visitor, given what it had saved. */
export function buildMoveUrl(saved: string | null, path = '/'): string {
  try {
    const state = saved ? JSON.parse(saved) : null;
    if (state && typeof state.feedUrl === 'string' && isFeedUrl(state.feedUrl)) {
      const carried: Carried = { feedUrl: state.feedUrl, status: state.status ?? {} };
      return `${CANONICAL_ORIGIN}/#import=${toBase64Url(JSON.stringify(carried))}`;
    }
  } catch { /* unreadable storage: just move them */ }
  return `${CANONICAL_ORIGIN}${path}`;
}

/** Reads a carried setup off the new address, or null if there isn't a valid one. */
export function readImport(hash: string): Carried | null {
  const match = /^#import=([A-Za-z0-9_-]+)$/.exec(hash);
  if (!match) return null;
  try {
    const data = JSON.parse(fromBase64Url(match[1]));
    if (typeof data?.feedUrl !== 'string' || !isFeedUrl(data.feedUrl)) return null;
    const status: Record<string, CourseworkStatus> = {};
    for (const [uid, value] of Object.entries(data.status ?? {})) {
      if (typeof value === 'string' && (STATUSES as string[]).includes(value)) status[uid] = value as CourseworkStatus;
    }
    return { feedUrl: data.feedUrl, status };
  } catch {
    return null;
  }
}
