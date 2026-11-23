import { useId, useState } from 'react';
import type { WeekRecord } from '../../api/types';
import { text } from '../../text';
import styles from './team.module.css';
import { datesOf } from './weeks';

const recentWeeks = 8;

// The latest weeks first; older ones on request, and they stay shown through refreshes.
export function HistoryCard({ history }: { history: WeekRecord[] }) {
  const [showingAll, setShowingAll] = useState(false);
  const titleId = useId();
  const shown = showingAll ? history : history.slice(0, recentWeeks);
  return (
    <div className="card">
      <h2 id={titleId}>{text.history.title}</h2>
      <table aria-labelledby={titleId}>
        <thead>
          <tr>
            <th className={styles.week}>{text.history.week}</th>
            <th>{text.history.dates}</th>
            <th>{text.history.presenter}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((record, index) => (
            <tr key={record.week.start} className={index === 0 ? styles.current : undefined}>
              <td className={styles.week}>{record.week.number}</td>
              <td className="muted">{datesOf(record.week, { withYear: true })}</td>
              <td>
                <div className={styles.presented}>{record.name}</div>
                {record.insteadOf && <div className="muted small">{text.history.insteadOf(record.insteadOf)}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!showingAll && history.length > recentWeeks && (
        <div className="actions">
          <button type="button" onClick={() => setShowingAll(true)}>{text.history.showAll(history.length)}</button>
        </div>
      )}
    </div>
  );
}
