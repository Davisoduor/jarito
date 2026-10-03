import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useJarito } from './hooks/useJarito';
import { readFeedFromHash } from './lib/handoff';
import { readImport } from './lib/migrate';
import { formatSyncedAt } from './lib/dates';
import { Mark } from './components/Mark';
import { Connect } from './components/Connect';
import { Watch } from './components/Watch';
import { InstallHint } from './components/InstallHint';
import { BrightspaceHelp, CanvasHelp, SupportPage } from './components/InfoPages';
import { currentPage } from './lib/pages';

export default function App() {
  const jarito = useJarito();
  const { state } = jarito;
  const page = currentPage();

  // Arriving from the "Open on my phone" QR code: connect, then scrub the feed
  // link out of the address bar and history.
  useEffect(() => {
    const hash = window.location.hash;
    const fromHash = readFeedFromHash(hash);
    const imported = readImport(hash);
    if (hash.startsWith('#feed=') || hash.startsWith('#import=')) {
      history.replaceState(null, '', window.location.pathname);
    }
    if (imported && imported.feedUrl !== state.feedUrl) jarito.importSaved(imported.feedUrl, imported.status);
    else if (fromHash && fromHash !== state.feedUrl) jarito.connect(fromHash);
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
        {page !== 'app' ? (
          <a className="btn btn-primary sync" href="/">Start watching</a>
        ) : jarito.connected && (
          <button className="btn btn-quiet sync" onClick={jarito.sync} disabled={jarito.syncing}>
            <RefreshCw size={15} className={jarito.syncing ? 'spin' : undefined} aria-hidden="true" />
            {jarito.syncing ? 'Checking…' : 'Check now'}
          </button>
        )}
      </header>

      {page === 'canvas' ? <CanvasHelp /> : page === 'brightspace' ? <BrightspaceHelp /> : page === 'support' ? <SupportPage /> : (
        <>
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
        </>
      )}

      <footer className="footer">
        <p>
          Free and open source. Built as an independent student tool.
        </p>
        <p className="footer-links">
          <a href="https://github.com/Davisoduor/jarito">Source on GitHub</a>
          <a href="/canvas">Canvas guide</a>
          <a href="/brightspace">Brightspace guide</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
        </p>
        <p className="footer-fine">Not affiliated with Instructure, Canvas, D2L or Brightspace.</p>
      </footer>
    </div>
  );
}
