import { text } from '../../text';
import { lastMovableIndex } from './peopleRows';
import styles from './PeopleFields.module.css';
import type { PeopleRows } from './usePeopleRows';

interface PeopleFieldsProps {
  legend: string;
  people: PeopleRows;
}

export function PeopleFields({ legend, people }: PeopleFieldsProps) {
  const { rows } = people;
  return (
    <fieldset className={styles.people}>
      <legend>{legend}</legend>
      <ol
        ref={people.listRef}
        className={styles.rows}
        onPointerMove={people.onListPointerMove}
        onLostPointerCapture={people.onListLostPointerCapture}
      >
        {rows.map((row, index) => {
          const isNewPerson = index === rows.length - 1;
          const who = row.name.trim() || text.people.unnamed(index + 1);
          const rowClass = [
            styles.row,
            isNewPerson ? styles.newPerson : '',
            row.id === people.draggedId ? styles.dragging : '',
          ].join(' ');
          return (
            <li key={row.id} className={rowClass}>
              <span
                className={styles.grip}
                title={text.people.drag}
                aria-hidden="true"
                onPointerDown={(event) => people.onGripPointerDown(event, row.id)}
              >
                ⠿
              </span>
              <input
                ref={people.inputRef(row.id)}
                value={row.name}
                maxLength={40}
                autoComplete="off"
                enterKeyHint="next"
                aria-label={text.people.person(index + 1)}
                placeholder={isNewPerson ? text.people.placeholder : ''}
                onChange={(event) => people.onRename(row.id, event.target.value)}
                onKeyDown={(event) => people.onKeyDown(event, row.id)}
                onPaste={(event) => people.onPaste(event, row.id)}
              />
              <button
                type="button"
                className={styles.move}
                aria-label={text.people.moveUp(who)}
                aria-disabled={index === 0}
                onClick={(event) => people.onMove(event, row.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.move}
                aria-label={text.people.moveDown(who)}
                aria-disabled={index >= lastMovableIndex(rows)}
                onClick={(event) => people.onMove(event, row.id, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.remove}
                aria-label={text.people.remove(who)}
                onClick={() => people.onRemove(row.id)}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}
