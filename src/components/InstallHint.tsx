import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'jarito:install-dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * The point of Jarito is opening it every day, and a home-screen icon is what
 * makes that effortless. Chrome/Android offer a real install prompt; iOS
 * Safari has none, so it gets the two-tap instructions instead.
 */
export function InstallHint() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (dismissed || isStandalone() || (!deferred && !isIos())) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="install" role="note">
      <p>
        {deferred
          ? 'Add Jarito to your home screen so checking your deadlines is one tap.'
          : <>Add Jarito to your home screen: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</>}
      </p>
      <div className="install-actions">
        {deferred && (
          <button className="btn btn-primary" onClick={async () => { await deferred.prompt(); setDeferred(null); dismiss(); }}>
            Add to home screen
          </button>
        )}
        <button className="btn btn-quiet" onClick={dismiss}>Not now</button>
      </div>
    </div>
  );
}
