import type { Platform } from './canvasIcs';

// Turns whatever a student types for "your school's address" into a link to
// their calendar: "sfsu", "sfsu.instructure.com", or a full URL they copied
// from any page of their school's Canvas or Brightspace all work.

const DEFAULT_DOMAIN: Record<Platform, string> = {
  canvas: 'instructure.com',
  brightspace: 'brightspace.com',
};

export function schoolHost(input: string, platform: Platform = 'canvas'): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(s)) return null;
  // A bare school name is almost always <name>.instructure.com or <name>.brightspace.com.
  return s.includes('.') ? s : `${s}.${DEFAULT_DOMAIN[platform]}`;
}

/**
 * Canvas has a fixed calendar URL. Brightspace's calendar URL includes an
 * org-unit id we can't know, so for Brightspace this opens the homepage and
 * the steps say to click Calendar.
 */
export function schoolCalendarUrl(input: string, platform: Platform = 'canvas'): string | null {
  const host = schoolHost(input, platform);
  if (!host) return null;
  return platform === 'canvas' ? `https://${host}/calendar` : `https://${host}/d2l/home`;
}

/** The school's Canvas host, read back out of a feed link a student pasted. */
export function hostFromFeed(feedUrl: string): string | null {
  try {
    return new URL(feedUrl).hostname || null;
  } catch {
    return null;
  }
}
