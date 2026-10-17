import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles.css';
import './popup.css';
import { preload } from './chromeState';
import { Popup } from './Popup';

// No analytics here: the extension makes no requests except to the
// student's own school.
await preload(['jarito:v1']);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
