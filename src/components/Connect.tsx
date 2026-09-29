import { useState } from 'react';
import type { Jarito } from '../hooks/useJarito';

export function Connect({ jarito }: { jarito: Jarito }) {
  const [draft, setDraft] = useState('');

  return (
    <main className="connect">
      <h1 className="connect-title">Keeps watch over your Canvas deadlines.</h1>
      <p className="connect-lede">
        Everything due across all your courses in one list, and a heads-up the moment a
        professor moves a date. Free, and no account to make.
      </p>

      <ol className="steps">
        <li><span>In Canvas, open <strong>Calendar</strong>.</span></li>
        <li><span>At the bottom right, click <strong>Calendar Feed</strong>.</span></li>
        <li><span>Copy the link and paste it below.</span></li>
      </ol>

      <form
        className="connect-form"
        onSubmit={e => { e.preventDefault(); jarito.connect(draft); }}
      >
        <label htmlFor="feed" className="field-label">Your Canvas calendar feed link</label>
        <div className="field-row">
          <input
            id="feed"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://school.instructure.com/feeds/calendars/user_….ics"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            aria-describedby="feed-note"
            aria-invalid={Boolean(jarito.error)}
          />
          <button className="btn btn-primary" type="submit" disabled={jarito.syncing || !draft.trim()}>
            {jarito.syncing ? 'Reading your calendar…' : 'Start watching'}
          </button>
        </div>
        {jarito.error && <p className="error" role="alert">{jarito.error}</p>}
        <p id="feed-note" className="note">
          The link is saved only in this browser. Anyone who has it can see your Canvas calendar,
          so treat it like a password. You can reset it in Canvas at any time.
        </p>
      </form>

      <p className="demo-offer">
        Not a student, or want to look first?{' '}
        <button type="button" className="link-btn" onClick={jarito.connectDemo}>See it with sample coursework</button>
      </p>

      <aside className="meaning">
        <p>
          <strong>Jarito</strong> (ja-REE-toh) is Dholuo for “the one who keeps watch.”
          It checks your calendar every time you open it, so a deadline that quietly moved
          doesn’t catch you out at 11:59&nbsp;pm.
        </p>
      </aside>
    </main>
  );
}
