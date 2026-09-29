import { useCallback, useState } from 'react';

/**
 * A view choice — a tab, a filter, a list/board toggle — remembered per device.
 *
 * These were plain `useState`, so every one of them reset the moment you
 * navigated away and back: the Coursework filter, the Internship Record tab,
 * the task board's list/board mode and the application filter all snapped back
 * to their defaults on each visit. That is fine for a value nobody chose, and
 * wrong for one they did.
 *
 * Local and per-device on purpose, exactly like the Command Deck layout prefs —
 * a filter is a property of how you are looking at the data right now, not of
 * the data, so it has no business in `os_state` or on another machine.
 *
 * `allowed` is enforced on read so a stale value from an older build — a filter
 * that no longer exists — falls back instead of leaving the page showing
 * nothing with no way to recover.
 */
export function usePersistedChoice<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored) ? stored as T : fallback;
    } catch {
      // Private windows and blocked site data throw on access rather than
      // returning null, so the read itself has to be guarded.
      return fallback;
    }
  });

  const set = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(key, next); } catch { /* preference only — not worth surfacing */ }
  }, [key]);

  return [value, set];
}
