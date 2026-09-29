import {
  unfold, unescapeText, parseSummary, parseDateValue, parseCanvasIcs,
  assignmentHash, diffAssignments, buildSeenMap, isFeedUrl, feedPlatform, normalizeFeedUrl, shortCourse,
  type CanvasAssignment,
} from './canvasIcs';

// Shapes taken verbatim from the real SFSU feed, including the line folding
// and the bracketed section suffix.
const REAL_EVENT = [
  'BEGIN:VEVENT',
  'DTSTAMP:20260822T024100Z',
  'UID:event-assignment-870207',
  'DTSTART;VALUE=DATE;VALUE=DATE:20260823',
  'CLASS:PUBLIC',
  'DESCRIPTION:You must complete the policy quiz with a grade of 100% before y',
  ' ou can proceed with any part of the course.',
  'SEQUENCE:0',
  'SUMMARY:Policy Quiz [2267-CSC-415-01-1-1538]',
  'URL;VALUE=URI:https://sfsu.instructure.com/calendar#assignment_870207',
  'X-ALT-DESC;FMTTYPE=text/html:<script src="evil.js"></script><p>html copy</p>',
  'END:VEVENT',
].join('\r\n');

const FEED = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${REAL_EVENT}\r\nEND:VCALENDAR`;

const assignment = (over: Partial<CanvasAssignment> = {}): CanvasAssignment => ({
  uid: 'event-assignment-1', title: 'Homework 1', course: 'CSC-415',
  due: '2026-09-01', description: '', url: '', ...over,
});

describe('unfold', () => {
  // ICS continues any line over 75 octets with a leading space. Without
  // unfolding, every long title and description is silently truncated.
  // Per RFC 5545 the fold removes the line break AND the single leading
  // whitespace — it does not insert a space. Canvas depends on this: the real
  // feed splits "before you" as "before y" + " ou can proceed".
  it('rejoins folded lines without inserting a space', () => {
    const out = unfold('DESCRIPTION:before y\r\n ou can proceed\r\nSUMMARY:x');
    expect(out[0]).toBe('DESCRIPTION:before you can proceed');
    expect(out[1]).toBe('SUMMARY:x');
  });

  it('treats a tab continuation the same as a space', () => {
    expect(unfold('A:one\r\n\ttwo')[0]).toBe('A:onetwo');
  });

  it('does not fold a line that merely starts a new property', () => {
    expect(unfold('A:one\r\nB:two')).toEqual(['A:one', 'B:two']);
  });
});

describe('unescapeText', () => {
  it('unescapes the sequences Canvas emits', () => {
    expect(unescapeText('a\\, b\\; c\\nd')).toBe('a, b; c\nd');
  });
});

describe('parseSummary', () => {
  // Filtering out numeric parts would drop the course number itself and turn
  // "CSC-415" into "CSC" — which is what the first implementation did.
  it('keeps the course number, not just the subject', () => {
    expect(parseSummary('Policy Quiz [2267-CSC-415-01-1-1538]'))
      .toEqual({ title: 'Policy Quiz', course: 'CSC-415' });
  });

  it('handles a subject containing a space', () => {
    expect(parseSummary('Reading [2267-AA S-360-01-1-8010]'))
      .toEqual({ title: 'Reading', course: 'AA S-360' });
  });

  it('leaves a title with no bracket alone', () => {
    expect(parseSummary('Just a title')).toEqual({ title: 'Just a title', course: '' });
  });
});

describe('parseDateValue', () => {
  it('reads an all-day due date', () => {
    expect(parseDateValue('20260823')).toEqual({ due: '2026-08-23' });
  });

  // An 11:59pm Pacific deadline is 06:59 the *next* day in UTC. Keeping the UTC
  // date would show every timed deadline a day late.
  //
  // The expected day is derived from the runner's own timezone rather than
  // hardcoded: '2026-08-23' is only the right answer west of Greenwich, so the
  // assertion used to fail in, say, Auckland — where that instant really is the
  // 24th — reporting a timezone difference as a code defect. Built from raw
  // Date getters, not the helper under test, so it still catches the original
  // bug of returning the UTC date.
  it('converts a UTC deadline into the local day', () => {
    const instant = new Date('2026-08-24T06:59:00Z');
    const expectedLocalDay =
      `${instant.getFullYear()}-`
      + `${String(instant.getMonth() + 1).padStart(2, '0')}-`
      + `${String(instant.getDate()).padStart(2, '0')}`;

    const out = parseDateValue('20260824T065900Z')!;
    expect(out.due).toBe(expectedLocalDay);
    expect(out.dueTime).toBeDefined();
  });

  it('never returns the raw UTC date when local differs from it', () => {
    // The defect this guards is "kept the UTC date". Only meaningful in a
    // timezone where the two disagree, which is every zone but UTC itself.
    const instant = new Date('2026-08-24T06:59:00Z');
    const utcDay = instant.toISOString().slice(0, 10);
    const localDay = `${instant.getFullYear()}-`
      + `${String(instant.getMonth() + 1).padStart(2, '0')}-`
      + `${String(instant.getDate()).padStart(2, '0')}`;

    if (utcDay === localDay) return; // running in UTC — nothing to distinguish
    expect(parseDateValue('20260824T065900Z')!.due).not.toBe(utcDay);
  });

  it('returns null for something that is not a date', () => {
    expect(parseDateValue('not-a-date')).toBeNull();
  });
});

describe('parseCanvasIcs', () => {
  it('parses a real Canvas event end to end', () => {
    const [a] = parseCanvasIcs(FEED);
    expect(a.uid).toBe('event-assignment-870207');
    expect(a.title).toBe('Policy Quiz');
    expect(a.course).toBe('CSC-415');
    expect(a.due).toBe('2026-08-23');
    expect(a.description).toContain('proceed with any part of the course');
  });

  // X-ALT-DESC carries an HTML duplicate complete with <script> tags. It is
  // never parsed and never stored, so it cannot reach a render path.
  it('discards the X- HTML duplicate entirely', () => {
    const [a] = parseCanvasIcs(FEED);
    const serialised = JSON.stringify(a);
    expect(serialised).not.toContain('<script');
    expect(serialised).not.toContain('evil.js');
    expect(serialised).not.toContain('html copy');
  });

  it('returns nothing for a feed with no events', () => {
    expect(parseCanvasIcs('BEGIN:VCALENDAR\r\nEND:VCALENDAR')).toEqual([]);
  });

  it('skips an event missing a due date rather than throwing', () => {
    const broken = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x\r\nSUMMARY:y\r\nEND:VEVENT\r\nEND:VCALENDAR';
    expect(parseCanvasIcs(broken)).toEqual([]);
  });

  it('sorts by due date', () => {
    const two = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:b', 'SUMMARY:Later [2267-CSC-415-01]', 'DTSTART:20261001', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:a', 'SUMMARY:Sooner [2267-CSC-415-01]', 'DTSTART:20260901', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    expect(parseCanvasIcs(two).map(a => a.title)).toEqual(['Sooner', 'Later']);
  });
});

describe('diffAssignments', () => {
  it('reports a brand new assignment', () => {
    const changes = diffAssignments([assignment()], {});
    expect(changes).toEqual([expect.objectContaining({ kind: 'added', title: 'Homework 1' })]);
  });

  // The whole reason for watching the feed: an instructor moving a deadline
  // changes what has to happen this week, so it is called out on its own rather
  // than folded into a generic "updated".
  it('calls a moved due date out separately, with both dates', () => {
    const before = buildSeenMap([assignment({ due: '2026-09-01' })]);
    const changes = diffAssignments([assignment({ due: '2026-09-08' })], before);
    expect(changes).toEqual([expect.objectContaining({
      kind: 'due-moved', from: '2026-09-01', to: '2026-09-08',
    })]);
  });

  it('reports a rewritten description as an edit', () => {
    const before = buildSeenMap([assignment({ description: 'old brief' })]);
    const changes = diffAssignments([assignment({ description: 'new brief' })], before);
    expect(changes).toEqual([expect.objectContaining({ kind: 'edited' })]);
  });

  it('reports a withdrawn assignment', () => {
    const before = buildSeenMap([assignment()]);
    expect(diffAssignments([], before)).toEqual([expect.objectContaining({ kind: 'removed' })]);
  });

  // Canvas bumps DTSTAMP on every regeneration; if that were hashed, every
  // sync would look like everything changed.
  it('reports nothing when the feed is unchanged', () => {
    const list = [assignment(), assignment({ uid: 'event-assignment-2', title: 'Homework 2' })];
    expect(diffAssignments(list, buildSeenMap(list))).toEqual([]);
  });

  it('does not double-report an assignment whose due date and title both moved', () => {
    const before = buildSeenMap([assignment({ due: '2026-09-01', title: 'Old' })]);
    const changes = diffAssignments([assignment({ due: '2026-09-08', title: 'New' })], before);
    expect(changes).toHaveLength(1);
    expect(changes[0].kind).toBe('due-moved');
  });
});

describe('assignmentHash', () => {
  it('changes when the due date changes', () => {
    expect(assignmentHash(assignment({ due: '2026-09-01' })))
      .not.toBe(assignmentHash(assignment({ due: '2026-09-02' })));
  });

  it('ignores fields that carry no meaning for the operator', () => {
    expect(assignmentHash(assignment({ url: 'a' }))).toBe(assignmentHash(assignment({ url: 'b' })));
  });
});

describe('feed links', () => {
  const BS = 'https://school.brightspace.com/d2l/le/calendar/feed/user/feed.ics?token=abc123def456';

  it('recognises Canvas and Brightspace feeds', () => {
    expect(feedPlatform('https://sfsu.instructure.com/feeds/calendars/user_AbC123.ics')).toBe('canvas');
    expect(feedPlatform(BS)).toBe('brightspace');
    expect(feedPlatform(BS.replace('?', '?feedOU=6606&'))).toBe('brightspace');
    expect(feedPlatform('webcal://learn.school.edu/d2l/le/calendar/feed/user/feed.ics?token=abc123def456')).toBe('brightspace');
  });

  it('rejects anything else', () => {
    expect(isFeedUrl('https://example.com/evil.ics')).toBe(false);
    expect(isFeedUrl('http://sfsu.instructure.com/feeds/calendars/user_x.ics')).toBe(false);
    expect(isFeedUrl('https://sfsu.instructure.com/courses/1')).toBe(false);
    expect(isFeedUrl('https://sfsu.instructure.com/feeds/calendars/user_x.ics?a=1')).toBe(false);
    expect(isFeedUrl('https://school.brightspace.com/d2l/le/calendar/feed/user/feed.ics')).toBe(false);
    expect(isFeedUrl(BS + '&redirect=https://evil.example')).toBe(false);
    expect(isFeedUrl(BS.replace('?', '?feedOU=abc&'))).toBe(false);
  });

  it('turns webcal into https', () => {
    expect(normalizeFeedUrl(' webcal://a.b/c ')).toBe('https://a.b/c');
  });
});

describe('Brightspace events', () => {
  const EVENT = [
    'BEGIN:VCALENDAR', 'BEGIN:VEVENT',
    'UID:6606-12345@school.brightspace.com',
    'DTSTART:20261002T035900Z',
    'SUMMARY:Lab Report 2 - Due',
    'LOCATION:BIO 101 - Introduction to Biology - Fall 2026',
    'DESCRIPTION:Submit to the dropbox.',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');

  it('takes the course from LOCATION and drops the "- Due" suffix', () => {
    const [a] = parseCanvasIcs(EVENT);
    expect(a.title).toBe('Lab Report 2');
    expect(a.course).toBe('BIO-101');
    expect(a.description).toBe('Submit to the dropbox.');
  });

  it('shortens long course names without a code', () => {
    expect(shortCourse('Academic Integrity Tutorial for All New Undergraduate Students')).toMatch(/…$/);
    expect(shortCourse('CHEM 2301 - Organic Chemistry')).toBe('CHEM-2301');
  });
});
