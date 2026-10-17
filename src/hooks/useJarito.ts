import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCanvasIcs, isFeedUrl, normalizeFeedUrl } from '../lib/canvasIcs';
import type { CourseworkStatus } from '../lib/types';
import { useLocalState } from './useLocalState';
import { DEMO_FEED, demoAssignments } from '../lib/demo';
import { todayISO } from '../lib/dates';
import { emptyState, isStaleDemo, nextState, type JaritoState } from '../lib/sync';

// Ported from D.O.O.'s useCanvas. The differences: no sign-in (the proxy is
// public and rate-limited), and state lives in localStorage instead of a
// Supabase row. What a sync does to the state lives in lib/sync.

const STORAGE_KEY = 'jarito:v1';
/** Re-sync when the app comes back into view after this long. */
const STALE_MS = 15 * 60 * 1000;

export function useJarito() {
  const [state, setState] = useLocalState<JaritoState>(STORAGE_KEY, emptyState);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const pull = useCallback(async (feedUrl: string, interactive: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSyncing(true);
    if (interactive) setError(null);

    try {
      const before = stateRef.current;
      const assignments = feedUrl === DEMO_FEED
        ? demoAssignments(todayISO(), before.feedUrl === DEMO_FEED && !isStaleDemo(before, feedUrl) ? 1 : 0)
        : parseCanvasIcs(await fetchIcs(feedUrl));

      setState(s => nextState(s, feedUrl, assignments));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Background refreshes fail quietly (offline, on a train); the cached list still shows.
      if (interactive) setError(message);
    } finally {
      inFlight.current = false;
      setSyncing(false);
    }
  }, [setState]);

  const connect = useCallback(async (feedUrl: string) => {
    const trimmed = normalizeFeedUrl(feedUrl);
    if (!isFeedUrl(trimmed)) {
      setError('That doesn’t look like a calendar feed link. Copy the whole link from Canvas (Calendar Feed) or Brightspace (Calendar, then Subscribe).');
      return;
    }
    await pull(trimmed, true);
  }, [pull]);

  /** Setup carried over from the old jarito.vercel.app address. */
  const importSaved = useCallback(async (feedUrl: string, status: Record<string, CourseworkStatus>) => {
    setState(s => ({ ...s, status: { ...status, ...s.status } }));
    await pull(normalizeFeedUrl(feedUrl), true);
  }, [pull, setState]);

  const connectDemo = useCallback(() => pull(DEMO_FEED, true), [pull]);

  const sync = useCallback(async () => {
    if (stateRef.current.feedUrl) await pull(stateRef.current.feedUrl, true);
  }, [pull]);

  /** Forget the feed but keep what's marked done, which a re-sync cannot rebuild. */
  const disconnect = useCallback(() => {
    setState(s => ({ ...emptyState, status: s.status }));
    setError(null);
  }, [setState]);

  const dismissChanges = useCallback(() => setState(s => ({ ...s, changes: [] })), [setState]);

  const setStatus = useCallback((uid: string, status: CourseworkStatus) => {
    setState(s => ({ ...s, status: { ...s.status, [uid]: status } }));
  }, [setState]);

  // Refresh on open, and again whenever the app returns to the foreground after
  // a while — an installed PWA can sit in the background for days.
  useEffect(() => {
    const refreshIfStale = () => {
      const s = stateRef.current;
      if (!s.feedUrl || document.visibilityState !== 'visible') return;
      const age = Date.now() - new Date(s.lastSyncedAt || 0).getTime();
      if (age > STALE_MS) pull(s.feedUrl, false);
    };
    if (stateRef.current.feedUrl) pull(stateRef.current.feedUrl, false);
    document.addEventListener('visibilitychange', refreshIfStale);
    return () => document.removeEventListener('visibilitychange', refreshIfStale);
  }, [pull]);

  return {
    state,
    connected: Boolean(state.feedUrl),
    isDemo: state.feedUrl === DEMO_FEED,
    syncing,
    error,
    connect,
    importSaved,
    connectDemo,
    sync,
    disconnect,
    dismissChanges,
    setStatus,
  };
}

export type Jarito = ReturnType<typeof useJarito>;

async function fetchIcs(feedUrl: string): Promise<string> {
  const res = await fetch('/api/feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedUrl }),
  });
  if (!res.ok) {
    let detail = `Sync failed (${res.status}).`;
    try { const b = await res.json(); if (b?.error) detail = b.error; } catch { /* keep status */ }
    throw new Error(detail);
  }
  return (await res.json()).ics;
}
