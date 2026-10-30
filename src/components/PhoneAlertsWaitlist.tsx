import { useState } from 'react';
import { useLocalState } from '../hooks/useLocalState';

// Before building phone alerts, find out whether students want them. A signup
// goes through the feedback form's endpoint as an email to the maintainer;
// nothing is stored on a server.

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

export function contactKind(value: string): 'email' | 'phone' | null {
  const v = value.trim();
  if (EMAIL.test(v)) return 'email';
  const digits = v.replace(/\D/g, '');
  if (/^\+?[\d\s().-]+$/.test(v) && digits.length >= 10 && digits.length <= 15) return 'phone';
  return null;
}

type Status = 'idle' | 'open' | 'sending' | 'error';

export function PhoneAlertsWaitlist() {
  const [saved, setSaved] = useLocalState('jarito-phone-waitlist', { joined: false });
  const [status, setStatus] = useState<Status>('idle');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');

  if (saved.joined) {
    return <p className="waitlist waitlist-done">You’re on the list. You’ll hear first when Jarito can text you.</p>;
  }

  if (status === 'idle') {
    return (
      <div className="waitlist">
        <span>Want a text the next time a date moves?</span>
        <button className="btn btn-quiet waitlist-open" onClick={() => setStatus('open')}>Text me next time</button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const kind = contactKind(contact);
    if (!kind) {
      setError('Enter an email address or a phone number with area code.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'phone-alerts',
          message: `Add me to the phone alerts waitlist. Contact: ${contact.trim()}`,
          replyTo: kind === 'email' ? contact.trim() : '',
        }),
      });
      if (res.ok) {
        setSaved({ joined: true });
        return;
      }
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Couldn’t add you right now. Try again.');
    } catch {
      setError('Couldn’t send. Check your connection and try again.');
    }
    setStatus('error');
  }

  return (
    <form className="waitlist waitlist-form" onSubmit={submit}>
      <label className="field-label" htmlFor="waitlist-contact">Text me the next time a date moves</label>
      <div className="field-row">
        <input
          id="waitlist-contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder="Phone number or email"
          value={contact}
          onChange={e => setContact(e.target.value)}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Adding…' : 'Add me'}
        </button>
      </div>
      {status === 'error' && error && <p className="waitlist-error" role="alert">{error}</p>}
      <p className="waitlist-fine">Texts aren’t live yet. This only tells us you want them, and we’ll contact you once, when they launch.</p>
    </form>
  );
}
