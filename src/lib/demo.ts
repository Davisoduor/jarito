import type { CanvasAssignment } from './canvasIcs';

// Sample coursework so anyone can see Jarito work before (or without) pasting
// a real feed — a portfolio visitor, a student deciding whether to trust it.
// Dates are relative to today so the demo never goes stale.

export const DEMO_FEED = 'demo';

function shift(today: string, days: number): string {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const a = (uid: string, title: string, course: string, due: string, dueTime?: string, description = ''): CanvasAssignment =>
  ({ uid: `demo-${uid}`, title, course, due, dueTime, description, url: '' });

/**
 * `round` 0 is the first sync. Round 1 plays the part of "the next time you
 * open it": a professor has pushed one deadline back and posted a new quiz,
 * which is exactly what the change report exists to catch.
 */
export function demoAssignments(today: string, round: number): CanvasAssignment[] {
  const list = [
    a('1', 'Reading response: Ngũgĩ, Decolonising the Mind ch. 1', 'ENG-214', shift(today, -1), '23:59'),
    a('2', 'Lab 4: Linked lists', 'CSC-220', shift(today, 0), '23:59'),
    a('3', 'Problem set 5', 'MATH-227', shift(today, 1), '17:00'),
    a('4', 'Project proposal', 'CSC-415', round === 0 ? shift(today, 3) : shift(today, 10), '23:59'),
    a('5', 'Midterm study guide', 'BIO-100', shift(today, 5)),
    a('6', 'Discussion post: week 6', 'ENG-214', shift(today, 6), '12:00'),
    a('7', 'Lab 5: Stacks and queues', 'CSC-220', shift(today, 12), '23:59'),
    a('8', 'Final paper outline', 'ENG-214', shift(today, 20), '23:59'),
  ];
  if (round > 0) list.push(a('9', 'Pop quiz: cell structure', 'BIO-100', shift(today, 2), '09:00'));
  return list;
}
