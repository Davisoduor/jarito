import { useEffect, useState } from 'react';

// useLocalState's contract over chrome.storage.local, which (unlike
// localStorage) the background worker can read too. chrome.storage is
// async, so the popup reads it once before the first render and hooks start
// from that snapshot; otherwise the setup screen would flash and the
// refresh-on-open would see an empty feed.

let snapshot: Record<string, unknown> = {};

export async function preload(keys: string[]): Promise<void> {
  try { snapshot = await chrome.storage.local.get(keys); } catch { /* start empty */ }
}

export function useChromeState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = snapshot[key];
    return saved && typeof saved === 'object' ? { ...fallback, ...saved } : fallback;
  });

  useEffect(() => {
    chrome.storage.local.set({ [key]: value }).catch(() => { /* in-memory only */ });
  }, [key, value]);

  return [value, setValue] as const;
}
