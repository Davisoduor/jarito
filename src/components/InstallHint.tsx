import { useEffect, useState } from 'react';
import { isIos, isStandalone } from '../lib/platform';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'jarito:install-dismissed';

/**
 * The point of Jarito is opening it every day, and a home-screen icon is what
 * makes that effortless. Chrome/Android offer a real install prompt and share
 * storage with the installed app.
 *
 * iOS has neither: no prompt, and a home-screen app gets its own storage,
 * separate from Safari's. Setting Jarito up in Safari and then adding it to
 * the home screen opens an empty app. So on iOS the hint copies the feed link
 * first, and the installed app's first screen offers to paste it.
 */
export function InstallHint({ feedUrl }: { feedUrl: string }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const ios = isIos();
  if (dismissed || isStandalone() || (!deferred && !ios)) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
    } catch { /* clipboard blocked; they can copy it from Canvas again */ }
  };

  if (deferred) {
    return (
      <div className="install" role="note">
        <p>Add Jarito to your home screen so checking your deadlines is one tap.</p>
        <div className="install-actions">
          <button className="btn btn-primary" onClick={async () => { await deferred.prompt(); setDeferred(null); dismiss(); }}>
            Add to home screen
          </button>
          <button className="btn btn-quiet" onClick={dismiss}>Not now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="install install-ios" role="note">
      <p className="install-lead">Put Jarito on your home screen</p>
      <ol className="install-steps">
        <li>
          <button className="btn btn-primary" onClick={copy}>{copied ? 'Link copied' : 'Copy my Canvas link'}</button>
        </li>
        <li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li>
        <li>Open Jarito from your home screen and tap <strong>Paste link</strong>. iPhone keeps the home-screen app separate from Safari, so it needs the link once more.</li>
      </ol>
      <button className="btn btn-quiet install-dismiss" onClick={dismiss}>Not now</button>
    </div>
  );
}
