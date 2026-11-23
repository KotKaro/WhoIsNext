// The people being typed in, one row each. The last row is always empty: typing in it adds the next one.
export interface PersonRow {
  id: number;
  name: string;
}

let lastRowId = 0;
const rowOf = (name: string): PersonRow => ({ id: ++lastRowId, name });
const isEmpty = (row: PersonRow) => row.name.trim() === '';

export const rowsFor = (names: string[]) => tidy(names.map(rowOf));

export const namesOf = (rows: PersonRow[]) => rows.map((row) => row.name.trim()).filter(Boolean);

// The empty last row is where the next person is typed, so it never moves and nothing goes after it.
export const lastMovableIndex = (rows: PersonRow[]) => rows.length - 2;

// Keeps one empty row at the end. A second one stays while it is being typed in.
export function tidy(rows: PersonRow[], editedId?: number): PersonRow[] {
  const tidied = [...rows];
  const hasSpareEmptyRow = () => {
    const [beforeLast, last] = tidied.slice(-2);
    return beforeLast !== undefined && last !== undefined
      && isEmpty(beforeLast) && isEmpty(last) && last.id !== editedId;
  };
  while (hasSpareEmptyRow()) {
    tidied.pop();
  }
  const last = tidied.at(-1);
  if (last === undefined || !isEmpty(last)) {
    tidied.push(rowOf(''));
  }
  return tidied;
}

export function rename(rows: PersonRow[], id: number, name: string): PersonRow[] {
  return tidy(rows.map((row) => (row.id === id ? { ...row, name } : row)), id);
}

export function remove(rows: PersonRow[], id: number): PersonRow[] {
  return tidy(rows.filter((row) => row.id !== id));
}

export function move(rows: PersonRow[], from: number, to: number): PersonRow[] {
  const target = Math.max(0, Math.min(to, lastMovableIndex(rows)));
  const row = rows[from];
  if (row === undefined || from > lastMovableIndex(rows) || target === from) {
    return rows;
  }
  const moved = rows.filter((_, index) => index !== from);
  moved.splice(target, 0, row);
  return moved;
}

// Where a dragged row lands: before the first other row whose middle is still below the pointer.
export function dropIndex(rowMiddles: number[], from: number, pointerY: number): number {
  return rowMiddles.filter((middle, index) => index !== from && middle < pointerY).length;
}

// A list copied from elsewhere: one name per line, the first column of a spreadsheet.
export function linesOf(pasted: string): string[] {
  return pasted.split(/\r?\n/).map((line) => (line.split('\t')[0] ?? '').trim()).filter(Boolean);
}

// The first line goes into the row pasted into when it is empty, the others into new rows after it.
// Returns the row to carry on typing in: the one after the pasted names.
export function paste(rows: PersonRow[], id: number, lines: string[]): { rows: PersonRow[]; focusId: number } {
  const index = rows.findIndex((row) => row.id === id);
  const target = rows[index];
  if (target === undefined) {
    return { rows, focusId: id };
  }
  const filled = isEmpty(target) ? { ...target, name: lines[0] ?? '' } : target;
  const added = (isEmpty(target) ? lines.slice(1) : lines).map(rowOf);
  const pasted = tidy([...rows.slice(0, index), filled, ...added, ...rows.slice(index + 1)], id);
  const lastPasted = pasted.findIndex((row) => row.id === (added.at(-1) ?? filled).id);
  return { rows: pasted, focusId: (pasted[lastPasted + 1] ?? filled).id };
}
