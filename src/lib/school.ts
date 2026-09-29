// Turns whatever a student types for "your Canvas address" into a link to
// their Canvas calendar: "sfsu", "sfsu.instructure.com", or a full URL they
// copied from any Canvas page all work.

export function canvasHost(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(s)) return null;
  // A bare school name is almost always <name>.instructure.com.
  return s.includes('.') ? s : `${s}.instructure.com`;
}

export function canvasCalendarUrl(input: string): string | null {
  const host = canvasHost(input);
  return host ? `https://${host}/calendar` : null;
}

/** The school's Canvas host, read back out of a feed link a student pasted. */
export function hostFromFeed(feedUrl: string): string | null {
  try {
    return new URL(feedUrl).hostname || null;
  } catch {
    return null;
  }
}
