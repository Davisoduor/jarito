/** Running as an installed home-screen app rather than in a browser tab. */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    // iPadOS reports itself as a Mac.
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Desktop Chrome, Edge, Brave or Arc: the browsers the Chrome extension runs in. */
export function isDesktopChromium(): boolean {
  const data = (navigator as Navigator & { userAgentData?: { mobile: boolean; brands: { brand: string }[] } }).userAgentData;
  if (data) return !data.mobile && data.brands.some(b => b.brand === 'Chromium');
  return /Chrome\//.test(navigator.userAgent) && !/Mobile|Android/.test(navigator.userAgent);
}
