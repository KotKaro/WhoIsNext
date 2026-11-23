import { http } from 'msw';
import { setupServer } from 'msw/node';
import { handle } from '../../src/worker.js';

// The page talks to the real Worker code, with KV kept in memory and a clock the test sets.
export const wednesdayOfWeek48 = new Date('2026-11-25T10:00:00Z');

let today = wednesdayOfWeek48;
let stored = new Map<string, string>();

const environment = {
  TIME_ZONE: 'Europe/Warsaw',
  TEAMS: {
    get: async (key: string, type?: string) => {
      const value = stored.get(key);
      if (value === undefined) return null;
      return type === 'json' ? JSON.parse(value) : value;
    },
    put: async (key: string, value: string) => {
      stored.set(key, value);
    },
  },
};

export const server = setupServer(
  http.all('*/api/*', ({ request }) => handle(request, environment, today)),
);

export function setToday(date: Date) {
  today = date;
}

export function resetBackend() {
  today = wednesdayOfWeek48;
  stored = new Map();
}

export async function createTeam(names: string[]): Promise<string> {
  const response = await handle(
    new Request('http://localhost/api/teams', { method: 'POST', body: JSON.stringify({ names }) }),
    environment,
    today,
  );
  const team: { id: string } = await response.json();
  return team.id;
}

// What someone else with the link does, from another browser.
export async function changePeopleElsewhere(teamId: string, names: string[]) {
  await handle(
    new Request(`http://localhost/api/teams/${teamId}`, { method: 'PUT', body: JSON.stringify({ names }) }),
    environment,
    today,
  );
}
