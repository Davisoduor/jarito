/** The crescent: Jarito keeps the night watch (Otieno — born at night). */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="mark">
      <rect width="64" height="64" rx="15" fill="var(--lake)" />
      <circle cx="31" cy="33" r="16" fill="var(--lantern)" />
      <circle cx="38" cy="27" r="12.5" fill="var(--lake)" />
    </svg>
  );
}
