import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseCanvasIcs, diffAssignments, buildSeenMap, isCanvasFeedUrl,
  type CanvasAssignment, type AssignmentChange, type SeenMap,
} from '../lib/canvasIcs';
import type { CourseworkStatus } from '../lib/types';
import { useLocalState } from './useLocalState';
import { DEMO_FEED, demoAssignments } from '../lib/demo';
import { todayISO } from '../lib/dates';

// Ported from D.O.O.'s useCanvas. The differences: no sign-in (the proxy is
// public and rate-limited), and state lives in localStorage instead of a
// Supabase row.

export interface JaritoState {
  /** Bearer-style URL. Stored only on this device. */
  feedUrl: string;
  assignments: CanvasAssignment[];
  /** Last-seen fingerprint per assignment, for change detection. */
  seen: SeenMap;
  /** Changes since earlier syncs, held until the student dismisses them. */
  changes: AssignmentChange[];
  lastSyncedAt: string;
  /** Keyed by assignment uid; anything absent is Open. */
  status: Record<string, CourseworkStatus>;
}

export const emptyState: JaritoState = {
  feedUrl: '', assignments: [], seen: {}, changes: [], lastSyncedAt: '', status: {},
};

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
      const assignments = feedUrl === DEMO_FEED
        ? demoAssignments(todayISO(), stateRef.current.feedUrl === DEMO_FEED ? 1 : 0)
        : parseCanvasIcs(await fetchIcs(feedUrl));

      const previous = stateRef.current;
      // A different feed (or the first one) would report every assignment as
      // "new", which is noise rather than news — set the baseline silently.
      const isBaseline = previous.feedUrl !== feedUrl || Object.keys(previous.seen).length === 0;
      const fresh = isBaseline ? [] : diffAssignments(assignments, previous.seen);

      setState(s => ({
        ...s,
        feedUrl,
        assignments,
        seen: buildSeenMap(assignments),
        // Accumulate: a change seen yesterday and not yet dismissed still matters today.
        changes: isBaseline ? [] : dedupeChanges([...fresh, ...s.changes]),
        lastSyncedAt: new Date().toISOString(),
        status: pruneStatus(s.status, assignments),
      }));
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
    const trimmed = feedUrl.trim();
    if (!isCanvasFeedUrl(trimmed)) {
      setError('That doesn’t look like a Canvas feed link. It should start with https:// and end in .ics');
      return;
    }
    await pull(trimmed, true);
  }, [pull]);

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

function pruneStatus(
  status: Record<string, CourseworkStatus>,
  assignments: CanvasAssignment[],
): Record<string, CourseworkStatus> {
  const live = new Set(assignments.map(a => a.uid));
  const next: Record<string, CourseworkStatus> = {};
  for (const [uid, value] of Object.entries(status ?? {})) {
    if (live.has(uid)) next[uid] = value;
  }
  return next;
}

/** Keeps the newest entry per assignment so repeated syncs don't stack duplicates. */
function dedupeChanges(changes: AssignmentChange[]): AssignmentChange[] {
  const seen = new Set<string>();
  const out: AssignmentChange[] = [];
  for (const c of changes) {
    const key = `${c.uid}:${c.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out.slice(0, 40);
}
