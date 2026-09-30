import { carryStatus } from './useJarito';
import type { CanvasAssignment } from '../lib/canvasIcs';

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
