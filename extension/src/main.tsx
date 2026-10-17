import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles.css';
import './popup.css';
import { preload } from './chromeState';
import { NOTIFY_KEY, STATE_KEY } from './watch';
import { Popup } from './Popup';

// No analytics here: the extension makes no requests except to the
// student's own school.
await preload([STATE_KEY, NOTIFY_KEY]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
