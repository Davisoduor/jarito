import { emptyState, type JaritoState } from '../../src/lib/sync';
import type { AssignmentChange } from '../../src/lib/canvasIcs';
import { alertFor, badgeFor, freshAlerts } from './watch';

const today = '2026-10-17';
const moved: AssignmentChange = { kind: 'due-moved', uid: 'p', title: 'Project proposal', course: 'CSC-415', from: '2026-10-20', to: '2026-10-27' };
const added: AssignmentChange = { kind: 'added', uid: 'q', title: 'Pop quiz', course: 'BIO-100' };
const edited: AssignmentChange = { kind: 'edited', uid: 'r', title: 'Lab 4', course: 'CSC-220' };

const state = (over: Partial<JaritoState>): JaritoState => ({ ...emptyState, feedUrl: 'https://x/feeds/calendars/user_a.ics', ...over });

describe('freshAlerts', () => {
  it('keeps new moved dates and new work, not edits or ones already waiting', () => {
    const prev = state({ changes: [added] });
    const next = state({ changes: [moved, edited, added] });
    expect(freshAlerts(prev, next)).toEqual([moved]);
  });
});

describe('alertFor', () => {
  it('says where a moved date went', () => {
    const a = alertFor([moved], state({}), today)!;
    expect(a.title).toBe('Due date moved: Project proposal');
    expect(a.message).toMatch(/^CSC-415 · was .*20, now .*27$/);
  });

  it('gives new work its due date', () => {
    const s = state({ assignments: [{ uid: 'q', title: 'Pop quiz', course: 'BIO-100', due: '2026-10-19', description: '', url: '' }] });
    expect(alertFor([added], s, today)!.message).toMatch(/^BIO-100 · due .*19$/);
  });

  it('sums up several changes in one notification', () => {
    expect(alertFor([moved, added], state({}), today)).toEqual({
      title: '2 changes in your courses',
      message: '1 date moved, 1 new assignment. Open Jarito to see them.',
    });
  });

  it('stays quiet with nothing to say', () => {
    expect(alertFor([], state({}), today)).toBeNull();
  });
});

describe('badgeFor', () => {
  const a = (uid: string, due: string) => ({ uid, title: uid, course: '', due, description: '', url: '' });

  it('is blank before a calendar is connected', () => {
    expect(badgeFor(emptyState, today).text).toBe('');
  });

  it('counts unread changes in lantern gold', () => {
    expect(badgeFor(state({ changes: [moved, added] }), today)).toEqual({ text: '2', color: '#E2A42B' });
  });

  it('otherwise counts what is still open today', () => {
    const s = state({ assignments: [a('1', today), a('2', today), a('3', '2026-10-18')], status: { 2: 'Done' } });
    expect(badgeFor(s, today)).toEqual({ text: '1', color: '#12465A' });
  });
});
