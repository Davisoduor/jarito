import nodemailer from 'nodemailer';
import { createRateLimiter } from './_lib/feed.js';
import { checkFeedback, feedbackEmail } from './_lib/feedback.js';

// Sends through the maintainer's existing mailbox over SMTP. Set in Vercel:
//   SMTP_HOST (default smtp.gmail.com, i.e. Google Workspace), SMTP_PORT (default 465),
//   SMTP_USER, SMTP_PASS (a Google App Password, not the account password),
//   FEEDBACK_TO (defaults to SMTP_USER).
// The password lives only in Vercel's encrypted environment variables.

const allow = createRateLimiter(5, 10 * 60_000);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!allow(ip)) return json({ error: 'That’s a lot of feedback at once. Try again in a few minutes.' }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Something went wrong sending that. Try again.' }, 400);
  }

  const checked = checkFeedback(body);
  if (!checked.ok) {
    // The honeypot "succeeds" so bots don't learn anything.
    return checked.status === 200 ? json({ ok: true }) : json({ error: checked.error }, checked.status);
  }

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    return json({ error: 'The feedback form isn’t connected yet. Email feedback@jarito.app instead.' }, 503);
  }

  const mail = feedbackEmail(checked.value);
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"Jarito feedback" <${SMTP_USER}>`,
      to: process.env.FEEDBACK_TO || SMTP_USER,
      replyTo: checked.value.replyTo || undefined,
      subject: mail.subject,
      text: mail.text,
    });
  } catch {
    // Never echo SMTP errors; they can include server details.
    return json({ error: 'Couldn’t send right now. Try again, or email feedback@jarito.app.' }, 502);
  }
  return json({ ok: true });
}
