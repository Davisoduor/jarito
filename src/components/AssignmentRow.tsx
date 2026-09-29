import { Check, ExternalLink } from 'lucide-react';
import type { CanvasAssignment } from '../lib/canvasIcs';
import type { CourseworkStatus } from '../lib/types';
import { daysUntil, formatDay, formatTime, relativeLabel } from '../lib/dates';

interface Props {
  a: CanvasAssignment;
  status: CourseworkStatus;
  today: string;
  moved: boolean;
  onStatus: (s: CourseworkStatus) => void;
}

export function AssignmentRow({ a, status, today, moved, onStatus }: Props) {
  const done = status === 'Done';
  const started = status === 'In Progress';
  const diff = daysUntil(a.due, today);
  const late = !done && diff < 0;

  return (
    <li className={`row${done ? ' is-done' : ''}${late ? ' is-late' : ''}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        className="check"
        onClick={() => onStatus(done ? 'Open' : 'Done')}
        aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${a.title}`}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="row-body">
        <p className="row-title">
          {a.url ? (
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {a.title}<ExternalLink size={12} aria-label="(opens Canvas)" className="row-ext" />
            </a>
          ) : a.title}
        </p>
        <p className="row-meta">
          {a.course && <span className="row-course">{a.course}</span>}
          <span className="row-due">
            {formatDay(a.due, today)}{a.dueTime ? `, ${formatTime(a.dueTime)}` : ''}
          </span>
          {!done && <span className="row-rel">{relativeLabel(diff)}</span>}
          {moved && <span className="row-moved">date moved</span>}
        </p>
      </div>

      {!done && (
        <button
          type="button"
          className={`started${started ? ' is-on' : ''}`}
          aria-pressed={started}
          onClick={() => onStatus(started ? 'Open' : 'In Progress')}
        >
          {started ? 'Started' : 'Start'}
        </button>
      )}
    </li>
  );
}
