// Feedback form → email to the maintainer. Students don't need an email app
// or a GitHub account; they type into a box on jarito.app.

export const MAX_MESSAGE = 4000;
const LMS = ['Canvas', 'Brightspace', 'Other', ''] as const;

export interface Feedback {
  message: string;
  school: string;
  lms: string;
  replyTo: string;
}

export type Checked = { ok: true; value: Feedback } | { ok: false; error: string; status: number };

// Either platform's feed link. Students are told not to paste it, but some
// will; it's a credential, so refuse rather than mail it around.
const FEED_LINK = /\/feeds\/calendars\/user_|\/d2l\/le\/calendar\/feed\//i;
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '';

export function checkFeedback(body: unknown): Checked {
  const b = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a field people never see. Bots fill every input.
  if (clean(b.website, 200)) return { ok: false, error: 'Thanks!', status: 200 };

  const message = clean(b.message, MAX_MESSAGE + 1);
  if (message.length < 3) return { ok: false, error: 'Write a little about what happened first.', status: 400 };
  if (message.length > MAX_MESSAGE) return { ok: false, error: `Keep it under ${MAX_MESSAGE} characters.`, status: 400 };

  const school = clean(b.school, 120);
  const lmsRaw = clean(b.lms, 20);
  const lms = (LMS as readonly string[]).includes(lmsRaw) ? lmsRaw : '';
  // Header injection is blocked by the address pattern (no CR/LF/commas).
  const replyTo = clean(b.replyTo, 200);
  if (replyTo && !EMAIL.test(replyTo)) return { ok: false, error: 'That email address doesn’t look right.', status: 400 };

  if (FEED_LINK.test(`${message} ${school}`)) {
    return { ok: false, error: 'Please remove your calendar feed link. It works like a password. A description or screenshot is enough.', status: 400 };
  }

  return { ok: true, value: { message, school, lms, replyTo } };
}

export function feedbackEmail(f: Feedback, now = new Date()) {
  const where = [f.school, f.lms].filter(Boolean).join(' · ') || 'school not given';
  return {
    subject: `Jarito feedback (${where})`,
    text: [
      f.message,
      '',
      '—',
      `School: ${f.school || '(not given)'}`,
      `System: ${f.lms || '(not given)'}`,
      `Reply to: ${f.replyTo || '(anonymous)'}`,
      `Sent: ${now.toISOString()}`,
    ].join('\n'),
  };
}
