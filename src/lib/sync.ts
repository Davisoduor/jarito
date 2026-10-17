import {
  diffAssignments, buildSeenMap,
  type CanvasAssignment, type AssignmentChange, type SeenMap,
} from './canvasIcs';
import type { CourseworkStatus } from './types';
import { DEMO_FEED } from './demo';
import { todayISO } from './dates';

// What a sync does to Jarito's state, with no React, storage or network in it.
// The web app (useJarito) and anything else that keeps watch — a browser
// extension's background worker, say — fetch the feed their own way and then
// hand the parsed assignments to nextState.

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

/**
 * The demo's dates are generated relative to today, so a demo left open
 * overnight would report every assignment as moved. It starts fresh daily.
 */
export function isStaleDemo(prev: JaritoState, feedUrl: string, now: Date = new Date()): boolean {
  return feedUrl === DEMO_FEED && prev.feedUrl === DEMO_FEED
    && (!prev.lastSyncedAt || todayISO(new Date(prev.lastSyncedAt)) !== todayISO(now));
}

/** The state after a successful sync of `feedUrl` returned `assignments`. */
export function nextState(
  prev: JaritoState,
  feedUrl: string,
  assignments: CanvasAssignment[],
  now: Date = new Date(),
): JaritoState {
  // A different feed (or the first one) would report every assignment as
  // "new", which is noise rather than news — set the baseline silently.
  const isBaseline = prev.feedUrl !== feedUrl || Object.keys(prev.seen).length === 0
    || isStaleDemo(prev, feedUrl, now);
  const fresh = isBaseline ? [] : diffAssignments(assignments, prev.seen);

  return {
    ...prev,
    feedUrl,
    assignments,
    seen: buildSeenMap(assignments),
    // Accumulate: a change seen yesterday and not yet dismissed still matters today.
    changes: isBaseline ? [] : dedupeChanges([...fresh, ...prev.changes]),
    lastSyncedAt: now.toISOString(),
    status: carryStatus(prev.status, prev.assignments, assignments),
  };
}

/**
 * Keeps what the student has ticked off across a sync.
 *
 * Status is keyed by the feed's UID, which Canvas keeps stable. If a feed
 * ever hands the same assignment a new UID (not ruled out for Brightspace),
 * the tick is carried over by matching title and course, rather than the
 * assignment silently reappearing as not done. Status for assignments that
 * no longer exist is dropped.
 */
export function carryStatus(
  status: Record<string, CourseworkStatus>,
  before: CanvasAssignment[],
  after: CanvasAssignment[],
): Record<string, CourseworkStatus> {
  const key = (a: CanvasAssignment) => `${a.title}|${a.course}`;
  const byKey = new Map<string, CourseworkStatus>();
  for (const a of before ?? []) {
    const s = status?.[a.uid];
    if (s) byKey.set(key(a), s);
  }
  const next: Record<string, CourseworkStatus> = {};
  for (const a of after) {
    const s = status?.[a.uid] ?? byKey.get(key(a));
    if (s) next[a.uid] = s;
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
