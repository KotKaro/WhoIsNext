import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { text } from '../text';

export const nameInputs = () => screen.getAllByRole<HTMLInputElement>('textbox', { name: /^Person \d+$/ });

export function nameInput(index: number) {
  const input = nameInputs().at(index);
  if (!input) throw new Error(`No name row at ${index}.`);
  return input;
}

export const typedNames = () => nameInputs().map((input) => input.value);

// There is always an empty last row to type the next name in.
export async function typeNames(user: UserEvent, names: string[]) {
  for (const name of names) {
    await user.type(nameInput(-1), name);
  }
}

export async function queueNames() {
  const queue = await screen.findByRole('table', { name: text.queue.title });
  return within(queue).getAllByRole('row').slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.firstElementChild?.textContent);
}
