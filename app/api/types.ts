// What the Worker (src/worker.js, src/rotation.js) sends back for a team.
export interface Week {
  start: string;
  number: number;
}

export interface QueuedPerson {
  name: string;
  week: Week;
  turns: number;
}

export interface WeekRecord {
  week: Week;
  name: string;
  insteadOf?: string;
}

export interface TeamView {
  id: string;
  queue: QueuedPerson[];
  history: WeekRecord[];
}
