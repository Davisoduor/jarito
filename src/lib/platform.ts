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
