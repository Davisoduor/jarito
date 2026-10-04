import { groupByDay, relativeLabel, todayISO } from './dates';

describe('dates', () => {
  it('formats today in local time', () => {
    expect(todayISO(new Date(2026, 8, 29, 23, 30))).toBe('2026-09-29');
  });

  it('groups by individual day, with Overdue first', () => {
    const today = '2026-10-03'; // a Saturday
    const groups = groupByDay([
      { due: '2026-10-01' }, { due: '2026-10-02' },
      { due: '2026-10-03' }, { due: '2026-10-04' },
      { due: '2026-10-06' }, { due: '2026-10-06' },
      { due: '2026-10-20' },
    ], today);
    expect(groups.map(g => [g.title, g.items.length])).toEqual([
      ['Overdue', 2], ['Today', 1], ['Tomorrow', 1], ['Tuesday', 2], ['Tuesday', 1],
    ]);
    expect(groups[3].date).toMatch(/Oct\s6/);
    expect(groups[4].key).toBe('2026-10-20');
  });

  it('labels relative days', () => {
    expect(relativeLabel(-1)).toBe('1 day late');
    expect(relativeLabel(-3)).toBe('3 days late');
    expect(relativeLabel(5)).toBe('in 5 days');
  });
});
