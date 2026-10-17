import { useEffect, useRef, useState } from 'react';

// useLocalState's contract over chrome.storage.local, which (unlike
// localStorage) the background worker reads and writes too. chrome.storage is
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
    if (saved && typeof saved === 'object' && fallback && typeof fallback === 'object') return { ...fallback, ...saved };
    return saved === undefined ? fallback : saved as T;
  });
  // What storage holds as far as we know, so a value that came from storage
  // isn't written straight back.
  const stored = useRef<string | null>(null);

  useEffect(() => {
    const json = JSON.stringify(value);
    if (json === stored.current) return;
    stored.current = json;
    chrome.storage.local.set({ [key]: value }).catch(() => { /* in-memory only */ });
  }, [key, value]);

  // The background check can update the list while the popup is open.
  useEffect(() => {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local' || !(key in changes)) return;
      const next = changes[key].newValue as T | undefined;
      if (next === undefined) return;
      stored.current = JSON.stringify(next);
      setValue(next);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [key]);

  return [value, setValue] as const;
}
