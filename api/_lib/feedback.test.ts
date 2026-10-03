import { checkFeedback, feedbackEmail, MAX_MESSAGE } from './feedback';

describe('checkFeedback', () => {
  it('accepts a normal message', () => {
    const r = checkFeedback({ message: 'Works great!', school: 'SFSU', lms: 'Canvas', replyTo: 'a@b.edu' });
    expect(r).toEqual({ ok: true, value: { message: 'Works great!', school: 'SFSU', lms: 'Canvas', replyTo: 'a@b.edu' } });
  });

  it('requires a message and caps its length', () => {
    expect(checkFeedback({ message: ' ' })).toMatchObject({ ok: false, status: 400 });
    expect(checkFeedback({ message: 'x'.repeat(MAX_MESSAGE + 1) })).toMatchObject({ ok: false, status: 400 });
  });

  it('refuses feed links, which are credentials', () => {
    expect(checkFeedback({ message: 'mine is https://s.instructure.com/feeds/calendars/user_abc.ics' })).toMatchObject({ ok: false });
    expect(checkFeedback({ message: 'x', school: 'https://s.brightspace.com/d2l/le/calendar/feed/user/feed.ics?token=1' })).toMatchObject({ ok: false });
  });

  it('rejects malformed reply addresses, including header injection', () => {
    expect(checkFeedback({ message: 'hi there', replyTo: 'not-an-email' })).toMatchObject({ ok: false });
    expect(checkFeedback({ message: 'hi there', replyTo: 'a@b.com\r\nBcc: x@y.com' })).toMatchObject({ ok: false });
  });

  it('quietly drops bot submissions caught by the honeypot', () => {
    expect(checkFeedback({ message: 'buy now', website: 'spam.example' })).toMatchObject({ ok: false, status: 200 });
  });

  it('ignores unknown LMS values', () => {
    const r = checkFeedback({ message: 'hello', lms: 'Moodle<script>' });
    expect(r.ok && r.value.lms).toBe('');
  });
});

describe('feedbackEmail', () => {
  it('summarises who it came from in the subject', () => {
    const m = feedbackEmail({ message: 'Hi', school: 'Purdue', lms: 'Brightspace', replyTo: '' }, new Date(0));
    expect(m.subject).toBe('Jarito feedback (Purdue · Brightspace)');
    expect(m.text).toContain('Reply to: (anonymous)');
  });
});
