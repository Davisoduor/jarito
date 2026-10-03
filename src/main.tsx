import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { OLD_HOSTS, buildMoveUrl } from './lib/migrate';

if (OLD_HOSTS.includes(window.location.hostname)) {
  // Jarito moved to jarito.app. Carry this visitor's setup with them.
  let saved: string | null = null;
  try { saved = localStorage.getItem('jarito:v1'); } catch { /* nothing to carry */ }
  window.location.replace(buildMoveUrl(saved, window.location.pathname));
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Ask the browser not to clear Jarito's storage under pressure; iOS in
// particular evicts site data it considers unimportant.
navigator.storage?.persist?.().catch(() => { /* best effort */ });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline shell is a bonus */ });
  });
}
