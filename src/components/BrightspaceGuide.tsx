/**
 * Brightspace hides its feed link behind two things: feeds must be switched on
 * in Calendar settings, then Subscribe shows the link. This draws the
 * Subscribe dialog with the link field ringed. Schematic, no D2L branding.
 */
export function BrightspaceGuide({ host }: { host: string }) {
  return (
    <figure className="guide">
      <svg viewBox="0 0 560 300" role="img" aria-labelledby="bs-title bs-desc">
        <title id="bs-title">Where to find the feed link in Brightspace</title>
        <desc id="bs-desc">
          In Brightspace Calendar, click Subscribe. In the window that opens, choose All Calendars and Tasks,
          then copy the link that ends in feed.ics followed by a token.
        </desc>

        <rect x="1" y="1" width="558" height="298" rx="12" className="g-window" />
        <path d="M1 13a12 12 0 0 1 12-12h534a12 12 0 0 1 12 12v19H1z" className="g-chrome" />
        <circle cx="18" cy="16" r="4" className="g-faint" />
        <circle cx="31" cy="16" r="4" className="g-faint" />
        <circle cx="44" cy="16" r="4" className="g-faint" />
        <rect x="62" y="8" width="250" height="16" rx="8" className="g-url" />
        <text x="72" y="20" className="g-url-text">{host}/d2l/le/calendar</text>

        {/* Calendar page behind the dialog */}
        <text x="24" y="58" className="g-heading">Calendar</text>
        <rect x="24" y="70" width="70" height="20" rx="4" className="g-cell" />
        <rect x="102" y="70" width="70" height="20" rx="4" className="g-cell" />
        <rect x="370" y="70" width="80" height="20" rx="10" className="g-ring" />
        <text x="383" y="84" className="g-link">Subscribe</text>
        <text x="468" y="84" className="g-small-heading">Settings</text>
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={24 + (i % 8) * 64} y={102 + Math.floor(i / 8) * 62} width="60" height="58" rx="3" className="g-cell" />
        ))}

        {/* Subscribe dialog */}
        <rect x="70" y="120" width="420" height="160" rx="10" className="g-dialog" />
        <text x="90" y="148" className="g-heading">Calendar Subscriptions</text>
        <rect x="90" y="162" width="200" height="24" rx="4" className="g-cell" />
        <text x="100" y="178" className="g-dialog-text">All Calendars and Tasks ▾</text>
        <rect x="88" y="200" width="384" height="30" rx="6" className="g-ring" />
        <text x="100" y="219" className="g-dialog-text">https://{host}/d2l/…/feed.ics?token=…</text>
        <text x="90" y="258" className="g-callout">Copy this whole link</text>
      </svg>
      <figcaption>
        No <strong>Subscribe</strong> button? Open Calendar <strong>Settings</strong>, tick
        <strong> Enable Calendar Feeds</strong>, save, and it appears.
      </figcaption>
    </figure>
  );
}
