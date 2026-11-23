import { changeQueue, cleanNames, mondayOf, startTeam, takeTurn, todayIn, viewOf } from './rotation.js';

const teamPagePath = /^\/t\/[A-Za-z0-9_-]{22}$/;
const teamApiPath = /^\/api\/teams\/([A-Za-z0-9_-]{22})(\/presenter)?$/;
const maxBodyLength = 10_000;

export default {
  fetch: (request, env) => handle(request, env, new Date()),
};

// Static files in public/ are served before the Worker runs; everything else comes here.
export async function handle(request, env, now) {
  const url = new URL(request.url);
  const monday = mondayOf(todayIn(env.TIME_ZONE ?? 'Europe/Warsaw', now));

  if (request.method === 'GET' && teamPagePath.test(url.pathname)) {
    return env.ASSETS.fetch(new Request(new URL('/', url)));
  }

  if (url.pathname === '/api/teams' && request.method === 'POST') {
    const { names, problem } = await readNames(request);
    if (problem) {
      return json({ error: problem }, 400);
    }
    const id = newTeamId();
    const team = startTeam(names, monday);
    await env.TEAMS.put(keyOf(id), JSON.stringify(team));
    return json({ id, ...viewOf(team, monday) }, 201);
  }

  const teamMatch = teamApiPath.exec(url.pathname);
  if (!teamMatch) {
    return json({ error: 'Not found.' }, 404);
  }

  const [, id, presenter] = teamMatch;
  const action = `${request.method} ${presenter ? 'presenter' : 'team'}`;
  if (!['GET team', 'PUT team', 'PUT presenter'].includes(action)) {
    return json({ error: 'Not found.' }, 404);
  }

  const team = await env.TEAMS.get(keyOf(id), 'json');
  if (!team) {
    return json({ error: 'No team at this link. Check the link, or create a new team.' }, 404);
  }
  if (action === 'GET team') {
    return json({ id, ...viewOf(team, monday) });
  }

  const { team: changed, problem } = action === 'PUT team'
    ? await changeNames(request, team, monday)
    : await takeTurnOf(request, team, monday);
  if (problem) {
    return json({ error: problem }, 400);
  }
  if (changed !== team) {
    await env.TEAMS.put(keyOf(id), JSON.stringify(changed));
  }
  return json({ id, ...viewOf(changed, monday) });
}

async function changeNames(request, team, monday) {
  const { names, problem } = await readNames(request);
  return problem ? { problem } : { team: changeQueue(team, names, monday) };
}

async function takeTurnOf(request, team, monday) {
  const { body, problem } = await readJson(request);
  if (problem) {
    return { problem };
  }
  if (typeof body?.name !== 'string' || body.name.trim() === '') {
    return { problem: 'Say whose turn it is.' };
  }
  return takeTurn(team, body.name.trim(), monday);
}

async function readNames(request) {
  const { body, problem } = await readJson(request);
  return problem ? { problem } : cleanNames(body?.names);
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > maxBodyLength) {
    return { problem: 'Too much text.' };
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { problem: 'Send JSON.' };
  }
}

const keyOf = (id) => `team:${id}`;

// 128 random bits: the link is the only key to the team.
function newTeamId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
