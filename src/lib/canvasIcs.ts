// ---- Canvas coursework via the ICS calendar feed -------------------------
// Canvas' REST API needs an access token most institutions don't let students
// generate. The calendar feed needs nothing: it is a stable, read-only URL
// every Canvas account exposes, and it re-reads on every sync, so an
// instructor moving a due date propagates without anyone doing anything.
//
// Two things learned from the real SFSU feed rather than the spec:
//  - SEQUENCE is 0 on every event, so it cannot be used to detect edits.
//    Change detection has to hash the content that matters.
//  - Long values are folded across lines with a leading space, so naive
//    line-splitting truncates descriptions and titles mid-word.

export interface CanvasAssignment {
  /** Canvas UID, e.g. "event-assignment-870207" — stable across edits. */
  uid: string;
  title: string;
  /** Course code parsed out of the bracketed suffix, e.g. "CSC-415". */
  course: string;
  /** Due date as YYYY-MM-DD. */
  due: string;
  /** Due time as HH:MM when the event is timed rather than all-day. */
  dueTime?: string;
  description: string;
  url: string;
}

/**
 * ICS folds any line longer than 75 octets by continuing it on the next line
 * with a single leading space or tab. Unfolding must happen before parsing or
 * every long title and description is silently cut short.
 */
export function unfold(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** ICS escapes commas, semicolons and newlines inside TEXT values. */
export function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Canvas titles carry the section in brackets:
 *   "Policy Quiz [2267-CSC-415-01-1-1538]"
 * The middle is the useful part — "CSC-415" — and the leading term code and
 * trailing section numbers are noise on a dashboard.
 */
export function parseSummary(summary: string): { title: string; course: string } {
  const match = summary.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
  if (!match) return { title: summary.trim(), course: '' };

  const title = match[1].trim();
  const parts = match[2].split('-');
  // The bracket is TERM-SUBJECT-NUMBER-SECTION-...-ID. Take subject and number
  // positionally: filtering out numeric parts would drop the course number
  // itself, turning "CSC-415" into "CSC".
  const start = /^\d{4}$/.test(parts[0]) ? 1 : 0;
  const course = parts.slice(start, start + 2).filter(Boolean).join('-');
  return { title, course: course || match[2] };
}

/** DTSTART is either `20260823` (all-day) or `20260823T235900Z` (timed). */
export function parseDateValue(value: string): { due: string; dueTime?: string } | null {
  const clean = value.trim();
  const dateOnly = clean.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) return { due: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}` };

  const timed = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!timed) return null;

  const [, y, mo, d, h, mi, s, zulu] = timed;
  if (zulu) {
    // A UTC deadline must be shown in the operator's own day. An 11:59pm
    // Pacific due date is 06:59 the *next* day in UTC, so keeping the UTC date
    // would show every deadline a day late.
    const local = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      due: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`,
      dueTime: `${pad(local.getHours())}:${pad(local.getMinutes())}`,
    };
  }
  return { due: `${y}-${mo}-${d}`, dueTime: `${h}:${mi}` };
}

/** Splits `KEY;PARAM=X:value` into its name and value, ignoring parameters. */
function splitProperty(line: string): { name: string; value: string } | null {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  return { name: head.split(';')[0].toUpperCase(), value: line.slice(colon + 1) };
}

export function parseCanvasIcs(raw: string): CanvasAssignment[] {
  const lines = unfold(raw);
  const out: CanvasAssignment[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) { current = {}; continue; }
    if (line.startsWith('END:VEVENT')) {
      if (current) {
        const assignment = buildAssignment(current);
        if (assignment) out.push(assignment);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const prop = splitProperty(line);
    // X-ALT-DESC carries an HTML duplicate of DESCRIPTION, complete with
    // stylesheet and script tags. Never render it; never store it.
    if (!prop || prop.name.startsWith('X-')) continue;
    current[prop.name] = prop.value;
  }

  return out.sort((a, b) => a.due.localeCompare(b.due));
}

function buildAssignment(fields: Record<string, string>): CanvasAssignment | null {
  const uid = fields.UID?.trim();
  const summary = fields.SUMMARY;
  const dtstart = fields.DTSTART;
  if (!uid || !summary || !dtstart) return null;

  const when = parseDateValue(dtstart);
  if (!when) return null;

  const { title, course } = parseSummary(unescapeText(summary));
  return {
    uid,
    title,
    course,
    due: when.due,
    dueTime: when.dueTime,
    description: fields.DESCRIPTION ? unescapeText(fields.DESCRIPTION) : '',
    url: fields.URL?.trim() ?? '',
  };
}

// ---- Change detection ---------------------------------------------------

/**
 * Fingerprint of the fields worth alerting on. Description is included because
 * an instructor rewriting the brief matters; DTSTAMP is not, because Canvas
 * bumps it on every regeneration and would make every sync look like a change.
 */
export function assignmentHash(a: CanvasAssignment): string {
  return `${a.title}|${a.due}|${a.dueTime ?? ''}|${a.description}`;
}

export type ChangeKind = 'added' | 'due-moved' | 'edited' | 'removed';

export interface AssignmentChange {
  kind: ChangeKind;
  uid: string;
  title: string;
  course: string;
  /** Present on due-moved. */
  from?: string;
  to?: string;
}

export type SeenMap = Record<string, { hash: string; due: string; title: string; course: string }>;

/**
 * Diffs a freshly fetched feed against what was seen last sync.
 *
 * A moved due date is called out separately from any other edit: it is the one
 * change that alters what the operator has to do this week, and burying it in a
 * generic "updated" would defeat the point of watching the feed at all.
 */
export function diffAssignments(current: CanvasAssignment[], seen: SeenMap): AssignmentChange[] {
  const changes: AssignmentChange[] = [];
  const currentUids = new Set<string>();

  for (const a of current) {
    currentUids.add(a.uid);
    const before = seen[a.uid];

    if (!before) {
      changes.push({ kind: 'added', uid: a.uid, title: a.title, course: a.course });
      continue;
    }
    if (before.due !== a.due) {
      changes.push({ kind: 'due-moved', uid: a.uid, title: a.title, course: a.course, from: before.due, to: a.due });
      continue;
    }
    if (before.hash !== assignmentHash(a)) {
      changes.push({ kind: 'edited', uid: a.uid, title: a.title, course: a.course });
    }
  }

  for (const [uid, before] of Object.entries(seen)) {
    if (!currentUids.has(uid)) {
      changes.push({ kind: 'removed', uid, title: before.title, course: before.course });
    }
  }

  return changes;
}

export function buildSeenMap(assignments: CanvasAssignment[]): SeenMap {
  const map: SeenMap = {};
  for (const a of assignments) {
    map[a.uid] = { hash: assignmentHash(a), due: a.due, title: a.title, course: a.course };
  }
  return map;
}

/** True when the URL looks like a Canvas calendar feed, so bad input fails early. */
export function isCanvasFeedUrl(url: string): boolean {
  return /^https:\/\/[a-z0-9.-]+\/feeds\/calendars\/user_[A-Za-z0-9]+\.ics$/i.test(url.trim());
}
