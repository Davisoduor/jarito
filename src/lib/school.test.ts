import { schoolCalendarUrl as canvasCalendarUrl, schoolHost as canvasHost, schoolCalendarUrl, schoolHost } from './school';

describe('canvasHost', () => {
  it('expands a bare school name to Instructure', () => {
    expect(canvasHost('SFSU')).toBe('sfsu.instructure.com');
  });

  it('keeps a school-hosted Canvas domain', () => {
    expect(canvasHost('canvas.school.edu')).toBe('canvas.school.edu');
  });

  it('pulls the host out of any Canvas URL', () => {
    expect(canvasHost('https://sfsu.instructure.com/courses/123?x=1')).toBe('sfsu.instructure.com');
  });

  it('rejects junk', () => {
    expect(canvasHost('')).toBeNull();
    expect(canvasHost('my school')).toBeNull();
    expect(canvasHost('javascript:alert(1)')).toBeNull();
  });
});

describe('canvasCalendarUrl', () => {
  it('links to the calendar page', () => {
    expect(canvasCalendarUrl('sfsu')).toBe('https://sfsu.instructure.com/calendar');
  });
});

describe('Brightspace', () => {
  it('expands a bare name to brightspace.com and opens the homepage', () => {
    expect(schoolHost('uvic', 'brightspace')).toBe('uvic.brightspace.com');
    expect(schoolCalendarUrl('learn.school.edu', 'brightspace')).toBe('https://learn.school.edu/d2l/home');
  });
});
