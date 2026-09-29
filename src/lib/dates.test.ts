import { bucketFor, daysUntil, relativeLabel, todayISO } from './dates';

describe('dates', () => {
  it('formats today in local time', () => {
    expect(todayISO(new Date(2026, 8, 29, 23, 30))).toBe('2026-09-29');
  });

  it('buckets by days remaining', () => {
    expect(bucketFor(daysUntil('2026-09-28', '2026-09-29'))).toBe('Overdue');
    expect(bucketFor(0)).toBe('Today');
    expect(bucketFor(1)).toBe('Tomorrow');
    expect(bucketFor(7)).toBe('This week');
    expect(bucketFor(8)).toBe('Later');
  });

  it('labels relative days', () => {
    expect(relativeLabel(-1)).toBe('1 day late');
    expect(relativeLabel(-3)).toBe('3 days late');
    expect(relativeLabel(5)).toBe('in 5 days');
  });
});
