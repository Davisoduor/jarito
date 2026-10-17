import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useJarito, type Jarito } from '../../src/hooks/useJarito';
import { formatSyncedAt } from '../../src/lib/dates';
import { Mark } from '../../src/components/Mark';
import { Watch } from '../../src/components/Watch';
import { useChromeState } from './chromeState';
import { fetchIcs } from './fetchIcs';

const deps = { fetchIcs, useStore: useChromeState };

export function Popup() {
  const jarito = useJarito(deps);
  const { state } = jarito;
  const courses = new Set(state.assignments.map(a => a.course).filter(Boolean)).size;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="https://jarito.app" target="_blank" rel="noreferrer" aria-label="Open jarito.app">
          <Mark size={26} />
          <span className="wordmark">Jarito</span>
        </a>
        {jarito.connected && (
          <button className="btn btn-quiet sync" onClick={jarito.sync} disabled={jarito.syncing}>
            <RefreshCw size={15} className={jarito.syncing ? 'spin' : undefined} aria-hidden="true" />
            {jarito.syncing ? 'Checking…' : 'Check now'}
          </button>
        )}
      </header>

      {jarito.isDemo && (
        <div className="demo-bar">
          <p>Sample coursework. Press <strong>Check now</strong> to see a moved deadline.</p>
          <button className="btn btn-primary" onClick={jarito.disconnect}>Use my own calendar</button>
        </div>
      )}

      {jarito.connected && (
        <p className="status" aria-live="polite">
          Watching {state.assignments.length} assignments in {courses} {courses === 1 ? 'course' : 'courses'}
          {state.lastSyncedAt && <>, checked {formatSyncedAt(state.lastSyncedAt)}</>}
          {jarito.error && <span className="status-error">. {jarito.error}</span>}
        </p>
      )}

      {jarito.connected ? <Watch jarito={jarito} /> : <Setup jarito={jarito} />}
    </div>
  );
}

/**
 * The web app's Connect screen walks through finding the link step by step.
 * The popup is too small for that, so it takes the link and points to the
 * guides. Reading it straight off the open Canvas tab comes next.
 */
function Setup({ jarito }: { jarito: Jarito }) {
  const [draft, setDraft] = useState('');

  return (
    <main className="connect">
      <h1 className="connect-title">Never miss a moved deadline again.</h1>
      <p className="connect-lede">
        Paste your Canvas or Brightspace calendar feed link. Jarito reads it straight from your school,
        on this computer only.
      </p>
      <form className="shortcut-form" onSubmit={e => { e.preventDefault(); jarito.connect(draft); }}>
        <input
          type="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…/feeds/calendars/user_….ics"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          aria-label="Calendar feed link"
        />
        <button className="btn btn-primary" type="submit" disabled={jarito.syncing || !draft.trim()}>
          {jarito.syncing ? 'Reading your calendar…' : 'Start watching'}
        </button>
      </form>
      {jarito.error && <p className="error" role="alert">{jarito.error}</p>}
      <p className="note">
        Where’s the link? <a href="https://jarito.app/canvas" target="_blank" rel="noreferrer">Canvas</a>
        {' · '}
        <a href="https://jarito.app/brightspace" target="_blank" rel="noreferrer">Brightspace</a>
      </p>
      <p className="note">
        <button type="button" className="btn btn-quiet" onClick={jarito.connectDemo}>Try it with sample coursework</button>
      </p>
    </main>
  );
}
