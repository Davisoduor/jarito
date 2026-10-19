import { isDesktopChromium } from '../lib/platform';

/** The Chrome Web Store listing, approved 19 October 2026. */
export const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/jarito/njllbjplgcpjikjdblangplnchnkpkgj';

/**
 * Desktop Chrome visitors get the install link: the extension finds the
 * calendar link on an open Canvas tab and checks hourly with this page
 * closed, which the site alone cannot do.
 */
export function ChromeInstall() {
  // The extension's popup reuses Watch; it shouldn't advertise itself.
  if (!isDesktopChromium() || !location.protocol.startsWith('http')) return null;
  return (
    <p className="note chrome-install">
      <strong>Jarito for Chrome</strong> finds your calendar link for you and notifies you when a
      date moves, even with this page closed.{' '}
      <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
        Add to Chrome
      </a>
    </p>
  );
}
