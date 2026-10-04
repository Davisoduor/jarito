// Dates are YYYY-MM-DD strings in the student's own timezone; canvasIcs has
// already converted Canvas' UTC timestamps, so plain string compares work.

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysUntil(dateStr: string, today: string): number {
  return Math.round(
    (new Date(dateStr + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000,
  );
}

export interface DayGroup<T> {
  key: string;
  /** "Overdue", "Today", "Tomorrow" or a weekday name. */
  title: string;
  /** The date beside the title, e.g. "Fri, Oct 3" or "Oct 6". Empty for Overdue. */
  date: string;
  overdue: boolean;
  items: T[];
}

/**
 * One group per day that has something due, in date order, with everything
 * already late gathered under Overdue first. `items` should be sorted by due.
 */
export function groupByDay<T extends { due: string }>(items: T[], today: string): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  const byKey = new Map<string, DayGroup<T>>();
  for (const item of items) {
    const diff = daysUntil(item.due, today);
    const key = diff < 0 ? 'overdue' : item.due;
    let group = byKey.get(key);
    if (!group) {
      group = diff < 0
        ? { key, title: 'Overdue', date: '', overdue: true, items: [] }
        : { key, ...dayTitle(item.due, diff, today), overdue: false, items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  // Overdue first even if the input wasn't strictly sorted.
  return groups.sort((a, b) => (a.overdue === b.overdue ? 0 : a.overdue ? -1 : 1));
}

function dayTitle(due: string, diff: number, today: string): { title: string; date: string } {
  const d = new Date(due + 'T00:00:00');
  const sameYear = due.slice(0, 4) === today.slice(0, 4);
  if (diff === 0) return { title: 'Today', date: formatDay(due, today) };
  if (diff === 1) return { title: 'Tomorrow', date: formatDay(due, today) };
  return {
    title: d.toLocaleDateString(undefined, { weekday: 'long' }),
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }),
  };
}

export function relativeLabel(diff: number): string {
  if (diff < -1) return `${-diff} days late`;
  if (diff === -1) return '1 day late';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}

/** "Thu, Oct 2" — the year only when it isn't this year. */
export function formatDay(dateStr: string, today: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const sameYear = dateStr.slice(0, 4) === today.slice(0, 4);
  return d.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** "23:59" -> "11:59 PM" in the reader's locale. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatSyncedAt(iso: string, now: Date = new Date()): string {
  if (!iso) return '';
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
