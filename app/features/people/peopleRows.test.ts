import { describe, expect, it } from 'vitest';
import { dropIndex, linesOf, move, namesOf, paste, rename, rowsFor, tidy, type PersonRow } from './peopleRows';

const namesIn = (rows: { name: string }[]) => rows.map((row) => row.name);

function idAt(rows: PersonRow[], index: number) {
  const row = rows.at(index);
  if (!row) throw new Error(`No row at ${index}.`);
  return row.id;
}

describe('peopleRows', () => {
  it('rowsFor_Names_EndsWithOneEmptyRow', () => {
    expect(namesIn(rowsFor(['Anna', 'Bartek']))).toEqual(['Anna', 'Bartek', '']);
    expect(namesIn(rowsFor([]))).toEqual(['']);
  });

  it('tidy_TwoEmptyRowsAtTheEnd_KeepsOne', () => {
    const rows = rowsFor(['Anna', 'Bartek']);

    const cleared = rename(rows, idAt(rows, 1), '');

    expect(namesIn(cleared)).toEqual(['Anna', '']);
  });

  it('tidy_LastOfTwoEmptyRowsBeingTyped_KeepsBoth', () => {
    const rows = [...rowsFor(['Anna']), ...rowsFor([])];

    const tidied = tidy(rows, idAt(rows, -1));

    expect(namesIn(tidied)).toEqual(['Anna', '', '']);
  });

  it('rename_TypingInTheEmptyRow_AddsTheNextOne', () => {
    const rows = rowsFor(['Anna']);

    const typed = rename(rows, idAt(rows, 1), 'B');

    expect(namesIn(typed)).toEqual(['Anna', 'B', '']);
  });

  it('namesOf_Rows_TrimsAndSkipsEmptyOnes', () => {
    const rows = [...rowsFor(['  Anna ']), ...rowsFor(['Bartek'])];

    expect(namesOf(rows)).toEqual(['Anna', 'Bartek']);
  });

  it('move_LastNameToTheTop_PutsItFirst', () => {
    const rows = rowsFor(['Anna', 'Bartek', 'Celina']);

    expect(namesIn(move(rows, 2, 0))).toEqual(['Celina', 'Anna', 'Bartek', '']);
  });

  it('move_PastTheEnd_StopsBeforeTheEmptyRow', () => {
    const rows = rowsFor(['Anna', 'Bartek', 'Celina']);

    expect(namesIn(move(rows, 0, 9))).toEqual(['Bartek', 'Celina', 'Anna', '']);
  });

  it('move_AboveTheTop_LeavesRowsAlone', () => {
    const rows = rowsFor(['Anna', 'Bartek']);

    expect(move(rows, 0, -1)).toBe(rows);
  });

  it('move_TheEmptyRow_LeavesRowsAlone', () => {
    const rows = rowsFor(['Anna', 'Bartek']);

    expect(move(rows, 2, 0)).toBe(rows);
  });

  it('dropIndex_PointerBetweenRowMiddles_CountsTheOtherRowsAbove', () => {
    const rowMiddles = [26, 78, 130, 182];

    expect(dropIndex(rowMiddles, 3, 10)).toBe(0);
    expect(dropIndex(rowMiddles, 3, 100)).toBe(2);
    expect(dropIndex(rowMiddles, 0, 150)).toBe(2);
    expect(dropIndex(rowMiddles, 0, 500)).toBe(3);
  });

  it('dropIndex_PointerStillOnTheDraggedRow_KeepsItsPlace', () => {
    const rowMiddles = [26, 78, 130];

    expect(dropIndex(rowMiddles, 1, 78)).toBe(1);
    expect(dropIndex(rowMiddles, 1, 100)).toBe(1);
  });

  it('linesOf_SpreadsheetCells_TakesTheFirstColumnOfEachLine', () => {
    expect(linesOf('Anna\t3\r\n\r\n  Bartek \nCelina\t1')).toEqual(['Anna', 'Bartek', 'Celina']);
  });

  it('paste_IntoTheEmptyRow_FillsItAndAddsTheRestAfter', () => {
    const rows = rowsFor(['Anna']);

    const pasted = paste(rows, idAt(rows, 1), ['Bartek', 'Celina']);

    expect(namesIn(pasted.rows)).toEqual(['Anna', 'Bartek', 'Celina', '']);
    expect(pasted.focusId).toBe(idAt(pasted.rows, 3));
  });

  it('paste_IntoANamedRow_AddsEveryLineAfterIt', () => {
    const rows = rowsFor(['Anna', 'Dawid']);

    const pasted = paste(rows, idAt(rows, 0), ['Bartek', 'Celina']);

    expect(namesIn(pasted.rows)).toEqual(['Anna', 'Bartek', 'Celina', 'Dawid', '']);
    expect(pasted.focusId).toBe(idAt(rows, 1));
  });
});
