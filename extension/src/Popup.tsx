import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useJarito, type Jarito } from '../../src/hooks/useJarito';
import { formatSyncedAt } from '../../src/lib/dates';
import { Mark } from '../../src/components/Mark';
import { Watch } from '../../src/components/Watch';
import { useChromeState } from './chromeState';
import { fetchIcs } from './fetchIcs';
import { activeWebTab, captureFeedLink, originPattern } from './capture';
import { NOTIFY_KEY } from './watch';

const deps = { fetchIcs, useStore: useChromeState };

export function Popup() {
  const jarito = useJarito(deps);
  const { state } = jarito;
  const [notify, setNotify] = useChromeState<boolean>(NOTIFY_KEY, true);
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

      {jarito.connected && !jarito.isDemo && (
        <label className="notify">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
          <span>
            Notify me when a due date moves or new work is posted.
            Jarito checks every hour while Chrome is open.
          </span>
        </label>
      )}
    </div>
  );
}

/**
 * The web app's Connect screen walks through finding the link step by step.
 * The popup can usually skip that: it reads the link off the open Canvas tab.
 * Pasting stays for everything else.
 */
function Setup({ jarito }: { jarito: Jarito }) {
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<{ id: number; url: string } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { activeWebTab().then(setTab); }, []);

  const grab = () => {
    if (!tab) return;
    const origins = [originPattern(tab.url)];
    // Ask now, while the click still counts: the feed lives on this same host,
    // and Chrome won't show the prompt after the awaits below.
    const permission = chrome.permissions.request({ origins }).catch(() => false);
    setGrabbing(true);
    setNotFound(false);
    (async () => {
      if (!(await permission)) return;
      const link = await captureFeedLink(tab.id).catch(() => null);
      if (!link) {
        // Nothing to watch here, so don't keep access to the site.
        chrome.permissions.remove({ origins }).catch(() => {});
        setNotFound(true);
        return;
      }
      setDraft(link);
      await jarito.connect(link);
    })().finally(() => setGrabbing(false));
  };

  const busy = grabbing || jarito.syncing;

  return (
    <main className="connect">
      <h1 className="connect-title">Never miss a moved deadline again.</h1>
      {tab && (
        <section className="grab" aria-labelledby="grab-title">
          <h2 id="grab-title">Signed in to Canvas in this tab?</h2>
          <p>Jarito can find your calendar link on {new URL(tab.url).hostname} for you.</p>
          <button type="button" className="btn btn-primary btn-wide" onClick={grab} disabled={busy}>
            {busy ? 'Finding your calendar…' : 'Get my link from this tab'}
          </button>
          {notFound && (
            <p className="note">
              No calendar link on this page. On Brightspace, open Calendar, press Subscribe, then try again.
              Or paste the link below.
            </p>
          )}
        </section>
      )}
      <p className="connect-lede">
        {tab ? 'Or paste' : 'Paste'} your Canvas or Brightspace calendar feed link. Jarito reads it straight
        from your school, on this computer only.
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
