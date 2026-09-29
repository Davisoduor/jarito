import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useJarito } from './hooks/useJarito';
import { readFeedFromHash } from './lib/handoff';
import { formatSyncedAt } from './lib/dates';
import { Mark } from './components/Mark';
import { Connect } from './components/Connect';
import { Watch } from './components/Watch';
import { InstallHint } from './components/InstallHint';

export default function App() {
  const jarito = useJarito();
  const { state } = jarito;

  // Arriving from the "Open on my phone" QR code: connect, then scrub the feed
  // link out of the address bar and history.
  useEffect(() => {
    const fromHash = readFeedFromHash(window.location.hash);
    if (window.location.hash.startsWith('#feed=')) {
      history.replaceState(null, '', window.location.pathname);
    }
    if (fromHash && fromHash !== state.feedUrl) jarito.connect(fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courses = new Set(state.assignments.map(a => a.course).filter(Boolean)).size;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Jarito home">
          <Mark size={30} />
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
          <p>
            You’re looking at sample coursework. Press <strong>Check now</strong> to see what Jarito
            shows when a professor moves a deadline.
          </p>
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

      {jarito.connected && !jarito.isDemo && <InstallHint feedUrl={state.feedUrl} />}
      {jarito.connected ? <Watch jarito={jarito} /> : <Connect jarito={jarito} />}

      <footer className="footer">
        <p>
          Free and open source. Built by <a href="https://davisoduor.me">Davis Oduor</a> of{' '}
          <a href="https://oduorwebservices.com">Oduor Web Services</a>.
        </p>
        <p className="footer-links">
          <a href="https://github.com/Davisoduor/jarito">Source on GitHub</a>
          <a href="/privacy">Privacy</a>
        </p>
        <p className="footer-fine">Not affiliated with Instructure, Canvas, D2L or Brightspace.</p>
      </footer>
    </div>
  );
}
