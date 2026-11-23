import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { flushSync } from 'react-dom';
import { dropIndex, linesOf, move, namesOf, paste, remove, rename, rowsFor } from './peopleRows';

// The rows of a people list and what typing, pasting, removing and moving them does.
// Rows move with the arrows or by dragging the grip, with a mouse or a finger.
export function usePeopleRows(initialNames: string[], { focusFirst = false } = {}) {
  const [rows, setRows] = useState(() => rowsFor(initialNames));
  const [draggedId, setDraggedId] = useState<number>();
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const pendingFocus = useRef<number | undefined>(focusFirst ? rows[0]?.id : undefined);

  useLayoutEffect(() => {
    if (pendingFocus.current === undefined) return;
    inputs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = undefined;
  });

  const indexOf = (id: number) => rows.findIndex((row) => row.id === id);

  function registerInput(id: number, input: HTMLInputElement | null) {
    if (input) {
      inputs.current.set(id, input);
    } else {
      inputs.current.delete(id);
    }
  }

  function onRemove(id: number) {
    const index = indexOf(id);
    const remaining = remove(rows, id);
    pendingFocus.current = remaining[Math.min(index, remaining.length - 1)]?.id;
    setRows(remaining);
  }

  // React may move the pressed button's row in the page, which drops focus; it goes straight back.
  function onMove(event: MouseEvent<HTMLButtonElement>, id: number, step: -1 | 1) {
    const button = event.currentTarget;
    const from = indexOf(id);
    flushSync(() => setRows(move(rows, from, from + step)));
    button.focus();
  }

  // Enter never sends the form from here: a half-typed list would go with it.
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, id: number) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const next = rows[indexOf(id) + 1];
    if (next) inputs.current.get(next.id)?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>, id: number) {
    const lines = linesOf(event.clipboardData.getData('text/plain'));
    if (lines.length < 2) return;
    event.preventDefault();
    const pasted = paste(rows, id, lines);
    pendingFocus.current = pasted.focusId;
    setRows(pasted.rows);
  }

  // The list holds the pointer, not the grip: React moves rows around while dragging.
  function onGripPointerDown(event: PointerEvent<HTMLElement>, id: number) {
    const list = event.currentTarget.closest('ol');
    if (draggedId !== undefined || !event.isPrimary || event.button !== 0 || !list) return;
    event.preventDefault();
    list.setPointerCapture(event.pointerId);
    setDraggedId(id);
  }

  function onListPointerMove(event: PointerEvent<HTMLOListElement>) {
    if (draggedId === undefined || !event.isPrimary) return;
    const rowMiddles = [...event.currentTarget.children].slice(0, -1).map((row) => {
      const box = row.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    const from = indexOf(draggedId);
    const to = dropIndex(rowMiddles, from, event.clientY);
    // Rows are measured again on the next move, so the page must already show this one.
    if (to !== from) flushSync(() => setRows(move(rows, from, to)));
  }

  // Comes after pointerup and pointercancel alike.
  function onListLostPointerCapture() {
    setDraggedId(undefined);
  }

  return {
    rows,
    draggedId,
    names: () => namesOf(rows),
    registerInput,
    onRename: (id: number, name: string) => setRows(rename(rows, id, name)),
    onRemove,
    onMove,
    onKeyDown,
    onPaste,
    onGripPointerDown,
    onListPointerMove,
    onListLostPointerCapture,
  };
}

export type PeopleRows = ReturnType<typeof usePeopleRows>;
