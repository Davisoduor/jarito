import { useEffect, useState } from 'react';

/**
 * State mirrored to localStorage. Everything Jarito knows lives here, on the
 * student's device; there is no account and no server-side copy.
 *
 * Storage can throw (private windows, blocked site data), so reads and writes
 * are guarded and the app keeps working in memory for that session.
 */
export function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* in-memory only */ }
  }, [key, value]);

  return [value, setValue] as const;
}
