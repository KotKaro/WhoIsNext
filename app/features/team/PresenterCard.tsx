import type { TeamView } from '../../api/types';
import { text } from '../../text';
import styles from './team.module.css';
import { weekLabel } from './weeks';

export function PresenterCard({ team }: { team: TeamView }) {
  const [current, upcoming] = team.queue;
  const insteadOf = team.history[0]?.insteadOf;
  if (!current) return null;
  return (
    <div className="card">
      <p className="muted small">{text.presenter.thisWeek(weekLabel(current.week))}</p>
      <p className={styles.presenter}>{current.name}</p>
      {insteadOf && <p className="muted">{text.presenter.insteadOf(insteadOf)}</p>}
      <p className="muted">
        {upcoming
          ? text.presenter.next(upcoming.name, weekLabel(upcoming.week))
          : text.presenter.againNextWeek(current.name)}
      </p>
    </div>
  );
}
