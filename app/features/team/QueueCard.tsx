import { useId, useState } from 'react';
import { useTakeTurn } from '../../api/teams';
import type { QueuedPerson, TeamView } from '../../api/types';
import { confirmAction } from '../../platform/dialogs';
import { text } from '../../text';
import { EditPeopleForm } from './EditPeopleForm';
import styles from './team.module.css';
import { datesOf, weekLabel } from './weeks';

interface QueueCardProps {
  teamId: string;
  team: TeamView;
}

export function QueueCard({ teamId, team }: QueueCardProps) {
  const [editing, setEditing] = useState(false);
  const takeTurn = useTakeTurn(teamId);
  const titleId = useId();
  const current = team.queue[0];

  function onTakeTurn(person: QueuedPerson) {
    if (!current) return;
    if (!confirmAction(text.queue.confirmTurn(person.name, current.name, weekLabel(person.week)))) return;
    takeTurn.mutate(person.name);
  }

  return (
    <div className="card">
      <h2 id={titleId}>{text.queue.title}</h2>
      <table aria-labelledby={titleId}>
        <thead>
          <tr>
            <th>{text.queue.name}</th>
            <th className={styles.number}>{text.queue.times}</th>
            <th aria-label={text.queue.turn}></th>
          </tr>
        </thead>
        <tbody>
          {team.queue.map((person, offset) => (
            <QueueRow key={person.name} person={person} isCurrent={offset === 0} onTakeTurn={onTakeTurn} />
          ))}
        </tbody>
      </table>
      <p className="muted small">{text.queue.timesHint}</p>
      {takeTurn.error && <p className="error" role="alert">{takeTurn.error.message}</p>}
      {editing
        ? (
          <EditPeopleForm
            teamId={teamId}
            names={team.queue.map((person) => person.name)}
            onClose={() => setEditing(false)}
          />
        )
        : (
          <div className="actions">
            <button type="button" onClick={() => setEditing(true)}>{text.queue.edit}</button>
          </div>
        )}
    </div>
  );
}

interface QueueRowProps {
  person: QueuedPerson;
  isCurrent: boolean;
  onTakeTurn: (person: QueuedPerson) => void;
}

function QueueRow({ person, isCurrent, onTakeTurn }: QueueRowProps) {
  return (
    <tr className={isCurrent ? styles.current : undefined}>
      <td>
        <div className={styles.name}>{person.name}</div>
        {isCurrent
          ? <div className="muted small">{text.queue.thisWeek}</div>
          : (
            <div className="muted small">
              {text.weeks.prefix(person.week.number)}
              <span className={styles.dates}>{datesOf(person.week)}</span>
            </div>
          )}
      </td>
      <td className={styles.number}>{person.turns}</td>
      <td className={styles.action}>
        {isCurrent
          ? <div className={styles.presenting}>{text.queue.presenting}</div>
          : (
            <button type="button" aria-label={text.queue.myTurnLabel(person.name)} onClick={() => onTakeTurn(person)}>
              {text.queue.myTurn}
            </button>
          )}
      </td>
    </tr>
  );
}
