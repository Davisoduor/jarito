import { useState } from 'react';
import { ExternalLink, ClipboardPaste } from 'lucide-react';
import type { Jarito } from '../hooks/useJarito';
import { canvasCalendarUrl, canvasHost } from '../lib/school';
import { FeedGuide } from './FeedGuide';

const SCHOOL_KEY = 'jarito:school';

export function Connect({ jarito }: { jarito: Jarito }) {
  const [draft, setDraft] = useState('');
  const [school, setSchool] = useState(() => {
    try { return localStorage.getItem(SCHOOL_KEY) ?? ''; } catch { return ''; }
  });
  const [pasteFailed, setPasteFailed] = useState(false);

  const calendarUrl = canvasCalendarUrl(school);
  const host = canvasHost(school) ?? 'yourschool.instructure.com';

  const rememberSchool = () => {
    try { localStorage.setItem(SCHOOL_KEY, school.trim()); } catch { /* optional */ }
  };

  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      setDraft(text);
      setPasteFailed(false);
      if (text) jarito.connect(text);
    } catch {
      // Firefox and some browsers don't allow reading the clipboard; typing still works.
      setPasteFailed(true);
      document.getElementById('feed')?.focus();
    }
  };

  return (
    <main className="connect">
      <h1 className="connect-title">Keeps watch over your Canvas deadlines.</h1>
      <p className="connect-lede">
        Everything due across all your courses in one list, and a heads-up the moment a
        professor moves a date. Free, and no account to make.
      </p>

      <ol className="setup">
        <li className="setup-step">
          <h2 className="setup-title">Open your Canvas calendar</h2>
          <p className="setup-help">Type your school’s Canvas address, or just the school name if it’s on Instructure.</p>
          <div className="field-row">
            <label htmlFor="school" className="sr-only">Your school’s Canvas address</label>
            <input
              id="school"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="sfsu.instructure.com"
              value={school}
              onChange={e => setSchool(e.target.value)}
            />
            <a
              className={`btn btn-primary${calendarUrl ? '' : ' is-disabled'}`}
              href={calendarUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!calendarUrl}
              onClick={e => { if (!calendarUrl) e.preventDefault(); else rememberSchool(); }}
            >
              Open my Canvas calendar <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
          <p className="note">
            On a phone, use your browser rather than the Canvas app; the app doesn’t show the feed link.
          </p>
        </li>

        <li className="setup-step">
          <h2 className="setup-title">Click <em>Calendar Feed</em> and copy the link</h2>
          <FeedGuide host={host} />
        </li>

        <li className="setup-step">
          <h2 className="setup-title">Paste it here</h2>
          <form onSubmit={e => { e.preventDefault(); jarito.connect(draft); }}>
            <button type="button" className="btn btn-primary btn-wide" onClick={paste} disabled={jarito.syncing}>
              <ClipboardPaste size={17} aria-hidden="true" />
              {jarito.syncing ? 'Reading your calendar…' : 'Paste link and start watching'}
            </button>
            <label htmlFor="feed" className="or-label">
              {pasteFailed ? 'Your browser blocked pasting. Paste into the box instead:' : 'or paste it into the box yourself'}
            </label>
            <div className="field-row">
              <input
                id="feed"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder={`https://${host}/feeds/calendars/user_….ics`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                aria-describedby="feed-note"
                aria-invalid={Boolean(jarito.error)}
              />
              <button className="btn" type="submit" disabled={jarito.syncing || !draft.trim()}>Start watching</button>
            </div>
            {jarito.error && <p className="error" role="alert">{jarito.error}</p>}
            <p id="feed-note" className="note">
              The link is saved only in this browser. Anyone who has it can see your Canvas calendar,
              so treat it like a password. You can reset it in Canvas at any time.
            </p>
          </form>
        </li>
      </ol>

      <p className="demo-offer">
        Want to look first?{' '}
        <button type="button" className="link-btn" onClick={jarito.connectDemo}>See it with sample coursework</button>
      </p>
    </main>
  );
}
