import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handle } from '../src/worker.js';

const mondayMorning = new Date('2026-11-23T08:00:00Z');
const aWeekLater = new Date('2026-11-30T08:00:00Z');

function testEnvironment() {
  const stored = new Map();
  return {
    TIME_ZONE: 'Europe/Warsaw',
    TEAMS: {
      get: async (key, type) => (stored.has(key) ? (type === 'json' ? JSON.parse(stored.get(key)) : stored.get(key)) : null),
      put: async (key, value) => { stored.set(key, value); },
    },
    ASSETS: { fetch: async (request) => new Response(`page for ${new URL(request.url).pathname}`) },
  };
}

const call = (environment, now, method, path, names, body = names && { names }) => handle(
  new Request(`https://who-is-next.test${path}`, body ? { method, body: JSON.stringify(body) } : { method }),
  environment,
  now,
);

async function createTeam(environment, names) {
  const response = await call(environment, mondayMorning, 'POST', '/api/teams', names);
  return (await response.json()).id;
}

describe('worker', () => {
  it('POST /api/teams creates a team whose first name presents this week', async () => {
    // Arrange
    const environment = testEnvironment();

    // Act
    const response = await call(environment, mondayMorning, 'POST', '/api/teams', ['Anna', 'Bartek']);

    // Assert
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.match(body.id, /^[A-Za-z0-9_-]{22}$/);
    assert.deepEqual(body.queue[0], { name: 'Anna', week: { start: '2026-11-23', number: 48 }, turns: 1 });
  });

  it('GET /api/teams/{id} a week later shows the next person', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna', 'Bartek']);

    // Act
    const response = await call(environment, aWeekLater, 'GET', `/api/teams/${id}`);

    // Assert
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.queue.map(({ name }) => name), ['Bartek', 'Anna']);
    assert.deepEqual(body.history.map(({ name }) => name), ['Bartek', 'Anna']);
  });

  it('PUT /api/teams/{id} saves the new queue for everyone who opens the link', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna', 'Bartek']);
    await call(environment, mondayMorning, 'PUT', `/api/teams/${id}`, ['Bartek', 'Anna', 'Celina']);

    // Act
    const response = await call(environment, mondayMorning, 'GET', `/api/teams/${id}`);

    // Assert
    const body = await response.json();
    assert.deepEqual(body.queue.map(({ name }) => name), ['Bartek', 'Anna', 'Celina']);
  });

  it('PUT /api/teams/{id} with the same name twice is refused with the reason', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna', 'Bartek']);

    // Act
    const response = await call(environment, mondayMorning, 'PUT', `/api/teams/${id}`, ['Anna', 'anna']);

    // Assert
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: '"anna" is on the list twice.' });
  });

  it('PUT /api/teams/{id}/presenter makes that person this week\'s presenter for everyone', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna', 'Bartek', 'Celina']);
    await call(environment, mondayMorning, 'PUT', `/api/teams/${id}/presenter`, undefined, { name: 'Celina' });

    // Act
    const response = await call(environment, mondayMorning, 'GET', `/api/teams/${id}`);

    // Assert
    const body = await response.json();
    assert.deepEqual(body.queue.map(({ name }) => name), ['Celina', 'Bartek', 'Anna']);
  });

  it('PUT /api/teams/{id}/presenter for someone not in the queue is refused with the reason', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna', 'Bartek']);

    // Act
    const response = await call(environment, mondayMorning, 'PUT', `/api/teams/${id}/presenter`, undefined, { name: 'Ewa' });

    // Assert
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: '"Ewa" is not in the queue any more.' });
  });

  it('GET /api/teams/{id}/presenter is not a route', async () => {
    // Arrange
    const environment = testEnvironment();
    const id = await createTeam(environment, ['Anna']);

    // Act
    const response = await call(environment, mondayMorning, 'GET', `/api/teams/${id}/presenter`);

    // Assert
    assert.equal(response.status, 404);
  });

  it('GET /api/teams/{id} for a link nobody created is 404', async () => {
    // Act
    const response = await call(testEnvironment(), mondayMorning, 'GET', '/api/teams/AAAAAAAAAAAAAAAAAAAAAA');

    // Assert
    assert.equal(response.status, 404);
  });

  it('POST /api/teams with a body that is not JSON is refused', async () => {
    // Act
    const response = await handle(
      new Request('https://who-is-next.test/api/teams', { method: 'POST', body: 'Anna' }),
      testEnvironment(),
      mondayMorning,
    );

    // Assert
    assert.equal(response.status, 400);
  });

  it('GET /t/{id} serves the page', async () => {
    // Act
    const response = await call(testEnvironment(), mondayMorning, 'GET', '/t/AAAAAAAAAAAAAAAAAAAAAA');

    // Assert
    assert.equal(await response.text(), 'page for /');
  });
});
