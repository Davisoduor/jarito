import { useMemo, useState } from 'react';
import type { Jarito } from '../hooks/useJarito';
import { usePersistedChoice } from '../hooks/usePersistedChoice';
import { BUCKETS, bucketFor, daysUntil, formatDay, formatTime, relativeLabel, todayISO, type Bucket } from '../lib/dates';
import type { CanvasAssignment } from '../lib/canvasIcs';
import { AssignmentRow } from './AssignmentRow';
import { Report } from './Report';
import { PhoneHandoff } from './PhoneHandoff';
import { SharePanel } from './SharePanel';

type View = 'todo' | 'done' | 'all';
const VIEWS: { id: View; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'Everything' },
];
const ALL_COURSES = '';

export function Watch({ jarito }: { jarito: Jarito }) {
  const { state } = jarito;
  const [view, setView] = usePersistedChoice<View>('jarito:view', ['todo', 'done', 'all'], 'todo');
  const [course, setCourse] = useState(ALL_COURSES);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const today = todayISO();

  const statusOf = (uid: string) => state.status[uid] ?? 'Open';
  const movedUids = useMemo(
    () => new Set(state.changes.filter(c => c.kind === 'due-moved').map(c => c.uid)),
    [state.changes],
  );

  const courses = useMemo(
    () => Array.from(new Set(state.assignments.map(a => a.course).filter(Boolean))).sort(),
    [state.assignments],
  );

  const byDue = (a: CanvasAssignment, b: CanvasAssignment) =>
    a.due.localeCompare(b.due) || (a.dueTime ?? '99').localeCompare(b.dueTime ?? '99');

  const inCourse = state.assignments.filter(a => !course || a.course === course);
  const open = inCourse.filter(a => statusOf(a.uid) !== 'Done').sort(byDue);
  const next = open.find(a => a.due >= today);
  const lateCount = open.filter(a => a.due < today).length;

  const visible =
    view === 'todo' ? open
    : view === 'done' ? inCourse.filter(a => statusOf(a.uid) === 'Done').sort((a, b) => byDue(b, a))
    : [...inCourse].sort(byDue);

  // Date buckets hold unfinished work only: a finished assignment is not
  // "Overdue", and counting it there kept the red heading up after it was
  // ticked. In Everything, finished work gets its own section at the end.
  const groups = new Map<Bucket, CanvasAssignment[]>();
  const finished = view === 'all' ? visible.filter(a => statusOf(a.uid) === 'Done') : [];
  if (view !== 'done') {
    for (const a of visible) {
      if (statusOf(a.uid) === 'Done') continue;
      const b = bucketFor(daysUntil(a.due, today));
      groups.set(b, [...(groups.get(b) ?? []), a]);
    }
  }

  return (
    <main className="watch">
      <div className="watch-side">
      <section className="next" aria-label="Next up">
        {next ? (
          <>
            <p className="next-when">
              Next up, {relativeLabel(daysUntil(next.due, today))}
              {next.dueTime ? ` at ${formatTime(next.dueTime)}` : ''}
            </p>
            <h1 className="next-title">{next.title}</h1>
            <p className="next-sub">
              {next.course && <>{next.course}, </>}
              due {formatDay(next.due, today)}
              {lateCount > 0 && <span className="next-late"> · {lateCount} overdue below</span>}
            </p>
          </>
        ) : (
          <>
            <p className="next-when">Next up</p>
            <h1 className="next-title">Nothing due. Jarito is keeping watch.</h1>
            {lateCount > 0 && <p className="next-sub"><span className="next-late">{lateCount} overdue below</span></p>}
          </>
        )}
      </section>

      {state.changes.length > 0 && <Report changes={state.changes} onDismiss={jarito.dismissChanges} />}
      </div>

      <div className="watch-main">
      <div className="controls">
        <div className="tabs" role="tablist" aria-label="Show">
          {VIEWS.map(v => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              className={`tab${view === v.id ? ' is-active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        {courses.length > 1 && (
          <label className="course-pick">
            <span className="sr-only">Course</span>
            <select value={course} onChange={e => setCourse(e.target.value)}>
              <option value={ALL_COURSES}>All courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>

      {visible.length === 0 || (view === 'all' && groups.size === 0 && finished.length === 0) ? (
        <p className="empty">
          {view === 'done' ? 'Nothing marked done yet. Tick an assignment when you submit it.' : 'Nothing left to do here.'}
        </p>
      ) : view === 'done' ? (
        <ul className="rows">
          {visible.map(a => (
            <AssignmentRow key={a.uid} a={a} status={statusOf(a.uid)} today={today} moved={false}
              onStatus={s => jarito.setStatus(a.uid, s)} />
          ))}
        </ul>
      ) : (
        BUCKETS.filter(b => groups.has(b)).map(b => (
          <section key={b} className={`group group-${b.replace(' ', '-').toLowerCase()}`} aria-labelledby={`g-${b}`}>
            <h2 id={`g-${b}`} className="group-title">
              {b}<span className="group-count">{groups.get(b)!.length}</span>
            </h2>
            <ul className="rows">
              {groups.get(b)!.map(a => (
                <AssignmentRow key={a.uid} a={a} status={statusOf(a.uid)} today={today} moved={movedUids.has(a.uid)}
                  onStatus={s => jarito.setStatus(a.uid, s)} />
              ))}
            </ul>
          </section>
        ))
      )}
      {finished.length > 0 && (
        <section className="group group-finished" aria-labelledby="g-finished">
          <h2 id="g-finished" className="group-title">
            Done<span className="group-count">{finished.length}</span>
          </h2>
          <ul className="rows">
            {finished.map(a => (
              <AssignmentRow key={a.uid} a={a} status="Done" today={today} moved={false}
                onStatus={s => jarito.setStatus(a.uid, s)} />
            ))}
          </ul>
        </section>
      )}
      </div>

      {!jarito.isDemo && <section className="device" aria-labelledby="device-title">
        <h2 id="device-title">This device</h2>
        <p>
          Jarito remembers your feed and what you’ve ticked off in this browser only.
          To use it on your phone too, scan a code instead of retyping the link.
        </p>
        <div className="device-actions">
          <button className="btn" onClick={() => setPhoneOpen(true)}>Open on my phone</button>
          <button className="btn btn-quiet" onClick={jarito.disconnect}>Disconnect calendar</button>
        </div>
      </section>}

      {!jarito.isDemo && <SharePanel />}

      {phoneOpen && <PhoneHandoff feedUrl={state.feedUrl} onClose={() => setPhoneOpen(false)} />}
    </main>
  );
}
