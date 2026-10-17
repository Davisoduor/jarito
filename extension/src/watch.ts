import type { AssignmentChange } from '../../src/lib/canvasIcs';
import type { JaritoState } from '../../src/lib/sync';
import { formatDay } from '../../src/lib/dates';

// What the background check tells the student: which changes deserve a
// notification, what it says, and what the toolbar badge shows. Pure, so it
// is tested without Chrome.

export const STATE_KEY = 'jarito:v1';
/** Notifications on unless the student turned them off. */
export const NOTIFY_KEY = 'jarito:notify';

/**
 * Changes this sync found that weren't already waiting in the report. Only
 * moved dates and new work: an edited description or a removed assignment
 * doesn't change what to do this week, so it waits for the popup.
 */
export function freshAlerts(prev: JaritoState, next: JaritoState): AssignmentChange[] {
  const known = new Set(prev.changes.map(c => `${c.uid}:${c.kind}`));
  return next.changes.filter(c =>
    (c.kind === 'due-moved' || c.kind === 'added') && !known.has(`${c.uid}:${c.kind}`));
}

export interface Alert { title: string; message: string }

/** One notification. Several changes at once become a single summary. */
export function alertFor(alerts: AssignmentChange[], state: JaritoState, today: string): Alert | null {
  if (alerts.length === 0) return null;
  if (alerts.length > 1) {
    const moved = alerts.filter(c => c.kind === 'due-moved').length;
    const added = alerts.length - moved;
    const parts = [
      moved && `${moved} ${moved === 1 ? 'date' : 'dates'} moved`,
      added && `${added} new ${added === 1 ? 'assignment' : 'assignments'}`,
    ].filter(Boolean);
    return { title: `${alerts.length} changes in your courses`, message: `${parts.join(', ')}. Open Jarito to see them.` };
  }
  const [c] = alerts;
  const where = c.course ? `${c.course} · ` : '';
  if (c.kind === 'due-moved') {
    return {
      title: `Due date moved: ${c.title}`,
      message: `${where}was ${formatDay(c.from!, today)}, now ${formatDay(c.to!, today)}`,
    };
  }
  const due = state.assignments.find(a => a.uid === c.uid)?.due;
  return { title: `New: ${c.title}`, message: `${where}${due ? `due ${formatDay(due, today)}` : 'just posted'}` };
}

export interface Badge { text: string; color: string }

/**
 * Lantern gold with a count when something moved (the one loud signal, as in
 * the app); otherwise how much is still open today, in lake blue.
 */
export function badgeFor(state: JaritoState, today: string): Badge {
  if (!state.feedUrl) return { text: '', color: '#12465A' };
  if (state.changes.length > 0) return { text: String(state.changes.length), color: '#E2A42B' };
  const dueToday = state.assignments.filter(a => a.due === today && state.status[a.uid] !== 'Done').length;
  return { text: dueToday ? String(dueToday) : '', color: '#12465A' };
}
