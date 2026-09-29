/**
 * A simplified drawing of the Canvas calendar page, pointing at the one link
 * students can never find: Calendar Feed, at the bottom of the right-hand
 * sidebar. Deliberately schematic (no Canvas branding), and themed through
 * CSS variables so it reads in dark mode too.
 */
export function FeedGuide({ host }: { host: string }) {
  const days = Array.from({ length: 35 }, (_, i) => i);
  const dots: Record<number, string> = { 3: 'var(--lake)', 9: 'var(--red)', 16: 'var(--reed)', 18: 'var(--lake)', 22: 'var(--red)', 30: 'var(--reed)' };

  return (
    <figure className="guide">
      <svg viewBox="0 0 560 330" role="img" aria-labelledby="guide-title guide-desc">
        <title id="guide-title">Where to find Calendar Feed in Canvas</title>
        <desc id="guide-desc">
          On the Canvas calendar page, the Calendar Feed link is at the very bottom of the right-hand
          sidebar, under the list of your courses. Clicking it shows a link ending in .ics.
        </desc>

        {/* Browser window */}
        <rect x="1" y="1" width="558" height="328" rx="12" className="g-window" />
        <path d="M1 13a12 12 0 0 1 12-12h534a12 12 0 0 1 12 12v19H1z" className="g-chrome" />
        <circle cx="18" cy="16" r="4" className="g-faint" />
        <circle cx="31" cy="16" r="4" className="g-faint" />
        <circle cx="44" cy="16" r="4" className="g-faint" />
        <rect x="62" y="8" width="250" height="16" rx="8" className="g-url" />
        <text x="72" y="20" className="g-url-text">{host}/calendar</text>

        {/* Left nav */}
        <rect x="1" y="32" width="40" height="297" className="g-nav" />
        {[52, 78, 104, 130, 156].map(y => <rect key={y} x="13" y={y} width="16" height="14" rx="3" className="g-faint" />)}
        <rect x="9" y="152" width="24" height="22" rx="4" className="g-nav-on" />

        {/* Month grid */}
        <text x="58" y="56" className="g-heading">Calendar</text>
        {days.map(i => {
          const x = 58 + (i % 7) * 50;
          const y = 70 + Math.floor(i / 7) * 48;
          return (
            <g key={i}>
              <rect x={x} y={y} width="46" height="44" rx="3" className="g-cell" />
              {dots[i] && <rect x={x + 5} y={y + 22} width="34" height="7" rx="2" fill={dots[i]} opacity="0.75" />}
            </g>
          );
        })}

        {/* Right sidebar */}
        <line x1="420" y1="40" x2="420" y2="322" className="g-rule" />
        <rect x="432" y="48" width="112" height="78" rx="4" className="g-cell" />
        <text x="432" y="146" className="g-small-heading">Calendars</text>
        {[160, 180, 200, 220].map((y, i) => (
          <g key={y}>
            <rect x="432" y={y - 9} width="10" height="10" rx="2" fill={['var(--lake)', 'var(--red)', 'var(--reed)', 'var(--lake)'][i]} opacity="0.75" />
            <rect x="448" y={y - 7} width={[70, 58, 76, 50][i]} height="6" rx="3" className="g-faint" />
          </g>
        ))}

        {/* The link, ringed */}
        <rect x="426" y="286" width="112" height="28" rx="14" className="g-ring" />
        <text x="438" y="305" className="g-link">Calendar Feed</text>

        {/* Pointer from the grid side */}
        <path d="M322 250 C 370 250, 390 300, 418 300" className="g-arrow" />
        <path d="M410 293 L 420 300 L 409 306" className="g-arrow" />
        <text x="236" y="244" className="g-callout">Click this, at the</text>
        <text x="236" y="262" className="g-callout">very bottom right</text>
      </svg>
      <figcaption>
        Not there? Scroll the page down: it’s below your list of courses. Canvas then shows a link ending in
        <strong> .ics</strong>. Copy the whole thing.
      </figcaption>
    </figure>
  );
}
