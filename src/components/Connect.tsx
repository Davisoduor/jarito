import { useState } from 'react';
import { ExternalLink, ClipboardPaste } from 'lucide-react';
import type { Jarito } from '../hooks/useJarito';
import { schoolCalendarUrl, schoolHost } from '../lib/school';
import { feedPlatform, normalizeFeedUrl, type Platform } from '../lib/canvasIcs';
import { usePersistedChoice } from '../hooks/usePersistedChoice';
import { FeedGuide } from './FeedGuide';
import { BrightspaceGuide } from './BrightspaceGuide';
import { isStandalone } from '../lib/platform';

const SCHOOL_KEY = 'jarito:school';

export function Connect({ jarito }: { jarito: Jarito }) {
  const [draft, setDraft] = useState('');
  const [school, setSchool] = useState(() => {
    try { return localStorage.getItem(SCHOOL_KEY) ?? ''; } catch { return ''; }
  });
  const [pasteFailed, setPasteFailed] = useState(false);

  const [platform, setPlatform] = usePersistedChoice<Platform>('jarito:platform', ['canvas', 'brightspace'], 'canvas');
  const canvas = platform === 'canvas';
  const lms = canvas ? 'Canvas' : 'Brightspace';
  // People often paste the feed link itself into the school box. That's the
  // finished article, so offer to start watching right there.
  const feedInSchool = feedPlatform(school) ? normalizeFeedUrl(school) : null;
  const calendarUrl = schoolCalendarUrl(school, platform);
  const host = schoolHost(school, platform) ?? (canvas ? 'yourschool.instructure.com' : 'yourschool.brightspace.com');
  const feedPlaceholder = canvas
    ? `https://${host}/feeds/calendars/user_….ics`
    : `https://${host}/d2l/le/calendar/feed/user/feed.ics?token=…`;

  const rememberSchool = () => {
    // Never keep a feed link here; it's a credential and belongs only in the connected state.
    if (feedInSchool) return;
    try { localStorage.setItem(SCHOOL_KEY, school.trim()); } catch { /* optional */ }
  };

  const watchFromSchoolBox = () => {
    if (!feedInSchool) return;
    try { localStorage.removeItem(SCHOOL_KEY); } catch { /* optional */ }
    setPlatform(feedPlatform(feedInSchool)!);
    jarito.connect(feedInSchool);
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

  const installed = isStandalone();

  return (
    <main className="connect">
      {installed && (
        <section className="welcome" aria-labelledby="welcome-title">
          <h2 id="welcome-title">Connect your calendar in the app</h2>
          <p>
            Your phone keeps the home-screen app separate from your browser, so it needs your calendar
            link once more. If you copied it, tap below. Otherwise follow the steps further down.
          </p>
          <button type="button" className="btn btn-primary btn-wide" onClick={paste} disabled={jarito.syncing}>
            <ClipboardPaste size={17} aria-hidden="true" />
            {jarito.syncing ? 'Reading your calendar…' : 'Paste link'}
          </button>
          {pasteFailed && <p className="note">Pasting was blocked. Use the box in step 3 below instead.</p>}
          {jarito.error && <p className="error" role="alert">{jarito.error}</p>}
        </section>
      )}

      <h1 className="connect-title">Keeps watch over your course deadlines.</h1>
      <p className="connect-lede">
        Everything due across all your courses in one list, and a heads-up the moment a
        professor moves a date. Works with Canvas and Brightspace. Free, and no account to make.
      </p>

      <fieldset className="platform">
        <legend>My school uses</legend>
        <div className="platform-options">
          <label>
            <input type="radio" name="platform" value="canvas" checked={canvas} onChange={() => setPlatform('canvas')} />
            <span>Canvas</span>
          </label>
          <label>
            <input type="radio" name="platform" value="brightspace" checked={!canvas} onChange={() => setPlatform('brightspace')} />
            <span>Brightspace / D2L <span className="beta">Beta</span></span>
          </label>
        </div>
      </fieldset>

      <ol className="setup">
        <li className="setup-step">
          <h2 className="setup-title">{canvas ? 'Open your Canvas calendar' : 'Open Brightspace, then Calendar'}</h2>
          <p className="setup-help">
            Type your school’s {lms} address, or just the school name if it ends in
            {canvas ? ' instructure.com' : ' brightspace.com'}.
          </p>
          <div className="field-row">
            <label htmlFor="school" className="sr-only">Your school’s {lms} address</label>
            <input
              id="school"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={canvas ? 'sfsu.instructure.com' : 'yourschool.brightspace.com'}
              value={school}
              onChange={e => setSchool(e.target.value)}
            />
            {feedInSchool ? (
              <button type="button" className="btn btn-primary" onClick={watchFromSchoolBox} disabled={jarito.syncing}>
                {jarito.syncing ? 'Reading your calendar…' : 'Start watching'}
              </button>
            ) : (
              <a
                className={`btn btn-primary${calendarUrl ? '' : ' is-disabled'}`}
                href={calendarUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!calendarUrl}
                onClick={e => { if (!calendarUrl) e.preventDefault(); else rememberSchool(); }}
              >
                {canvas ? 'Open my Canvas calendar' : 'Open my Brightspace'} <ExternalLink size={15} aria-hidden="true" />
              </a>
            )}
          </div>
          {feedInSchool && (
            <p className="found" role="status">
              That’s your calendar feed link, so you can skip the rest. Press <strong>Start watching</strong>.
            </p>
          )}
          {feedInSchool && jarito.error && <p className="error" role="alert">{jarito.error}</p>}
          <p className="note">
            {canvas
              ? 'On a phone, use your browser rather than the Canvas app; the app doesn’t show the feed link.'
              : 'In Brightspace, click Calendar in the top menu (or the Calendar widget on your homepage). Use a browser, not the Pulse app.'}
          </p>
        </li>

        <li className="setup-step">
          {canvas ? (
            <>
              <h2 className="setup-title">Click <em>Calendar Feed</em> and copy the link</h2>
              <FeedGuide host={host} />
            </>
          ) : (
            <>
              <h2 className="setup-title">Click <em>Subscribe</em> and copy the link</h2>
              <p className="setup-help">Pick <strong>All Calendars and Tasks</strong> so every course is included.</p>
              <BrightspaceGuide host={host} />
            </>
          )}
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
                placeholder={feedPlaceholder}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                aria-describedby="feed-note"
                aria-invalid={Boolean(jarito.error)}
              />
              <button className="btn" type="submit" disabled={jarito.syncing || !draft.trim()}>Start watching</button>
            </div>
            {!installed && jarito.error && <p className="error" role="alert">{jarito.error}</p>}
            <p id="feed-note" className="note">
              The link is saved only in this browser. Anyone who has it can see your {lms} calendar,
              so treat it like a password. You can reset it in {lms} at any time.
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
