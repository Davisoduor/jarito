import { isDesktopChromium } from '../lib/platform';

/**
 * The extension is waiting on Chrome Web Store review. Until it's listed,
 * desktop Chrome visitors get a heads-up; when it's live this becomes the
 * install link.
 */
export function ChromeSoon() {
  // The extension's popup reuses Watch; it shouldn't advertise itself.
  if (!isDesktopChromium() || !location.protocol.startsWith('http')) return null;
  return (
    <p className="note chrome-soon">
      <strong>Coming soon: Jarito for Chrome.</strong> It finds your calendar link for you and
      notifies you when a date moves, even with this page closed.
    </p>
  );
}
