import { carryStatus, nextState, emptyState } from './sync';
import type { CanvasAssignment } from './canvasIcs';

const a = (uid: string, title: string, course = 'BIO-101'): CanvasAssignment =>
  ({ uid, title, course, due: '2026-10-01', description: '', url: '' });

describe('carryStatus', () => {
  it('keeps status for assignments that are still there', () => {
    expect(carryStatus({ x: 'Done' }, [a('x', 'Lab')], [a('x', 'Lab')])).toEqual({ x: 'Done' });
  });

  it('follows an assignment whose UID changed', () => {
    expect(carryStatus({ old: 'Done' }, [a('old', 'Lab 2')], [a('new', 'Lab 2')])).toEqual({ new: 'Done' });
  });

  it('drops status for assignments that are gone', () => {
    expect(carryStatus({ x: 'Done' }, [a('x', 'Lab')], [a('y', 'Quiz')])).toEqual({});
  });
});

describe('nextState', () => {
  const feed = 'https://school.instructure.com/feeds/calendars/user_abc.ics';
  const now = new Date('2026-10-02T12:00:00Z');
  const lab = (due: string) => ({ ...a('x', 'Lab'), due });

  it('sets a silent baseline on the first sync', () => {
    const s = nextState(emptyState, feed, [lab('2026-10-05')], now);
    expect(s.changes).toEqual([]);
    expect(s.seen.x.due).toBe('2026-10-05');
    expect(s.lastSyncedAt).toBe(now.toISOString());
  });

  it('reports a moved due date on a later sync and keeps it until dismissed', () => {
    const first = nextState(emptyState, feed, [lab('2026-10-05')], now);
    const moved = nextState(first, feed, [lab('2026-10-09')], now);
    expect(moved.changes).toEqual([
      { kind: 'due-moved', uid: 'x', title: 'Lab', course: 'BIO-101', from: '2026-10-05', to: '2026-10-09' },
    ]);
    expect(nextState(moved, feed, [lab('2026-10-09')], now).changes).toHaveLength(1);
  });

  it('treats a different feed as a fresh baseline', () => {
    const first = nextState(emptyState, feed, [lab('2026-10-05')], now);
    const other = nextState(first, feed.replace('abc', 'def'), [lab('2026-10-09')], now);
    expect(other.changes).toEqual([]);
  });
});
