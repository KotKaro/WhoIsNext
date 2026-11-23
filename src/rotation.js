// A team is a list of queues, oldest first: { queues: [{ from: '2026-11-23', names: ['Anna', 'Bartek'] }] }.
// Each week from a queue's Monday on, the next name presents, until a newer queue takes over.
// Changing the queue adds a queue from this week, so past weeks keep who actually presented;
// it also notes who was due that week (`due`), for "Celina, instead of Anna".

export const maxNames = 50;
export const maxNameLength = 40;

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const weekInMilliseconds = 7 * dayInMilliseconds;

const toTime = (date) => Date.parse(`${date}T00:00:00Z`);
const toDate = (time) => new Date(time).toISOString().slice(0, 10);

export function todayIn(timeZone, now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(now);
}

export function mondayOf(date) {
  const time = toTime(date);
  const daysSinceMonday = (new Date(time).getUTCDay() + 6) % 7;
  return toDate(time - daysSinceMonday * dayInMilliseconds);
}

export function weekOf(monday) {
  const thursday = toTime(monday) + 3 * dayInMilliseconds;
  const januaryFirst = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return { start: monday, number: Math.floor((thursday - januaryFirst) / weekInMilliseconds) + 1 };
}

const addWeeks = (monday, weeks) => toDate(toTime(monday) + weeks * weekInMilliseconds);
const weeksBetween = (fromMonday, toMonday) => Math.round((toTime(toMonday) - toTime(fromMonday)) / weekInMilliseconds);

const activeQueue = (queues, monday) => queues.findLast((candidate) => candidate.from <= monday) ?? queues[0];

// The names in order from the given week on: the first one presents that week.
function queueOn(queues, monday) {
  const queue = activeQueue(queues, monday);
  const position = Math.max(0, weeksBetween(queue.from, monday)) % queue.names.length;
  return queue.names.map((_, offset) => queue.names[(position + offset) % queue.names.length]);
}

// A week whose queue was changed that week says who was due before the change.
function recordOf(team, monday) {
  const queue = activeQueue(team.queues, monday);
  const name = queueOn(team.queues, monday)[0];
  const due = queue.from === monday ? queue.due : undefined;
  return due && due !== name ? { week: weekOf(monday), name, insteadOf: due } : { week: weekOf(monday), name };
}

export function startTeam(names, monday) {
  return { queues: [{ from: monday, names }] };
}

// The new names are in order from this week on: the first one presents this week.
// A change replaces any earlier change this week, so it carries over who was due before them.
export function changeQueue(team, names, monday) {
  const thisWeek = recordOf(team, monday);
  return {
    queues: [
      ...team.queues.filter((queue) => queue.from < monday),
      { from: monday, names, due: thisWeek.insteadOf ?? thisWeek.name },
    ],
  };
}

// The person presents this week and whoever was presenting takes their turn; nobody else moves.
export function takeTurn(team, name, monday) {
  const names = queueOn(team.queues, monday);
  const position = names.indexOf(name);
  if (position === -1) {
    return { problem: `"${name}" is not in the queue any more.` };
  }
  if (position === 0) {
    return { team };
  }
  const swapped = [...names];
  [swapped[0], swapped[position]] = [swapped[position], swapped[0]];
  return { team: changeQueue(team, swapped, monday) };
}

export function viewOf(team, monday) {
  const history = [];
  for (let week = team.queues[0].from; week <= monday; week = addWeeks(week, 1)) {
    history.push(recordOf(team, week));
  }
  history.reverse();

  const turns = new Map();
  for (const record of history) {
    turns.set(record.name, (turns.get(record.name) ?? 0) + 1);
  }

  return {
    queue: queueOn(team.queues, monday).map((name, offset) => (
      { name, week: weekOf(addWeeks(monday, offset)), turns: turns.get(name) ?? 0 }
    )),
    history,
  };
}

export function cleanNames(value) {
  if (!Array.isArray(value) || value.some((name) => typeof name !== 'string')) {
    return { problem: 'Names must be a list of text.' };
  }

  const names = value.map((name) => name.trim()).filter((name) => name.length > 0);
  if (names.length === 0) {
    return { problem: 'Add at least one name.' };
  }
  if (names.length > maxNames) {
    return { problem: `At most ${maxNames} names.` };
  }

  const tooLong = names.find((name) => name.length > maxNameLength);
  if (tooLong) {
    return { problem: `"${tooLong}" is longer than ${maxNameLength} characters.` };
  }

  const seen = new Set();
  for (const name of names) {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) {
      return { problem: `"${name}" is on the list twice.` };
    }
    seen.add(key);
  }

  return { names };
}
