import type { Week } from '../../api/types';
import { text } from '../../text';

const dayInMilliseconds = 86_400_000;
const shortDates = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDates = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// "30 Nov – 6 Dec", or with the year: "30 Nov 2026 – 6 Dec 2026".
export function datesOf(week: Week, { withYear = false } = {}) {
  const monday = new Date(`${week.start}T00:00:00Z`);
  const sunday = new Date(monday.getTime() + 6 * dayInMilliseconds);
  return (withYear ? fullDates : shortDates).formatRange(monday, sunday);
}

export const weekLabel = (week: Week) => text.weeks.label(week.number, datesOf(week));
