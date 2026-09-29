import type { AssignmentChange } from '../lib/canvasIcs';
import { formatDay, todayISO } from '../lib/dates';

const LABEL: Record<AssignmentChange['kind'], string> = {
  'due-moved': 'Date moved',
  'added': 'New',
  'edited': 'Details changed',
  'removed': 'Removed',
};

// Moved dates first: they are the change that alters what you do this week.
const ORDER: AssignmentChange['kind'][] = ['due-moved', 'added', 'edited', 'removed'];

export function Report({ changes, onDismiss }: { changes: AssignmentChange[]; onDismiss: () => void }) {
  const today = todayISO();
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  const count = changes.length;

  return (
    <section className="report" aria-labelledby="report-title">
      <div className="report-head">
        <h2 id="report-title">
          {count === 1 ? 'One thing changed since you last looked' : `${count} things changed since you last looked`}
        </h2>
        <button className="btn btn-quiet" onClick={onDismiss}>Got it</button>
      </div>
      <ul className="report-list">
        {sorted.map(c => (
          <li key={`${c.uid}-${c.kind}`} className={`report-row kind-${c.kind}`}>
            <span className="report-kind">{LABEL[c.kind]}</span>
            <span className="report-title">{c.title}</span>
            {c.kind === 'due-moved' && c.from && c.to && (
              <span className="report-move">
                <s>{formatDay(c.from, today)}</s> now <strong>{formatDay(c.to, today)}</strong>
              </span>
            )}
            {c.course && <span className="report-course">{c.course}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
