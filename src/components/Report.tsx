import type { AssignmentChange } from '../lib/canvasIcs';
import { formatDay, todayISO } from '../lib/dates';
import { PhoneAlertsWaitlist } from './PhoneAlertsWaitlist';

const LABEL: Record<AssignmentChange['kind'], string> = {
  'due-moved': 'Date moved',
  'added': 'New',
  'edited': 'Details changed',
  'removed': 'Removed',
};

// Moved dates first: they are the change that alters what you do this week.
const ORDER: AssignmentChange['kind'][] = ['due-moved', 'added', 'edited', 'removed'];

function Row({ c, today }: { c: AssignmentChange; today: string }) {
  return (
    <li className={`report-row kind-${c.kind}`}>
      <span className="report-kind">{LABEL[c.kind]}</span>
      <span className="report-title">{c.title}</span>
      {c.kind === 'due-moved' && c.from && c.to && (
        <span className="report-move">
          <s>{formatDay(c.from, today)}</s> now <strong>{formatDay(c.to, today)}</strong>
        </span>
      )}
      {c.course && <span className="report-course">{c.course}</span>}
    </li>
  );
}

function headline(count: number, removed: number) {
  if (count === 0) return removed === 1 ? 'One item left your calendar' : `${removed} items left your calendar`;
  return count === 1 ? 'One thing changed since you last looked' : `${count} things changed since you last looked`;
}

export function Report({ changes, onDismiss }: { changes: AssignmentChange[]; onDismiss: () => void }) {
  const today = todayISO();
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  // Removals are mostly old work rolling off the feed. Counted alongside a
  // moved date they bury it, so they get one folded line instead.
  const real = sorted.filter(c => c.kind !== 'removed');
  const removed = sorted.filter(c => c.kind === 'removed');

  return (
    <section className="report" aria-labelledby="report-title">
      <div className="report-head">
        <h2 id="report-title">{headline(real.length, removed.length)}</h2>
        <button className="btn btn-quiet" onClick={onDismiss}>Got it</button>
      </div>
      <ul className="report-list">
        {(real.length > 0 ? real : removed).map(c => <Row key={`${c.uid}-${c.kind}`} c={c} today={today} />)}
      </ul>
      {real.length > 0 && removed.length > 0 && (
        <details className="report-removed">
          <summary>{removed.length === 1 ? '1 item removed from your calendar' : `${removed.length} items removed from your calendar`}</summary>
          <ul className="report-list">
            {removed.map(c => <Row key={`${c.uid}-${c.kind}`} c={c} today={today} />)}
          </ul>
        </details>
      )}
      {real.length > 0 && <PhoneAlertsWaitlist />}
    </section>
  );
}
