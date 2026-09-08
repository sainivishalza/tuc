// Free order-timing planner — no external API. China's manufacturing
// calendar has a handful of fixed and near-fixed closures that catch
// first-time buyers off guard; this checks a target delivery date against
// them and works out a safer order-by date.

export interface CalendarEvent {
  name: string;
  start: string; // ISO date, "YYYY-MM-DD"
  end: string; // ISO date, inclusive
  impact: "closure" | "peak-season";
  note: string;
}

// Chinese New Year dates are fixed years in advance on the lunar calendar
// and published by the Chinese government — this isn't data that goes
// stale the way a live rate would. The window is widened roughly 10 days
// before to 18 days after the public holiday itself, since factories
// commonly close a week early for workers to travel home and take another
// one to two weeks to fully ramp back up to normal output.
const CNY_DATES: { year: number; date: string }[] = [
  { year: 2025, date: "2025-01-29" },
  { year: 2026, date: "2026-02-17" },
  { year: 2027, date: "2027-02-06" },
  { year: 2028, date: "2028-01-26" },
  { year: 2029, date: "2029-02-13" },
  { year: 2030, date: "2030-02-03" },
  { year: 2031, date: "2031-01-23" },
];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);
}

function buildCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const { year, date } of CNY_DATES) {
    events.push({
      name: `Chinese New Year ${year}`,
      start: addDays(date, -10),
      end: addDays(date, 18),
      impact: "closure",
      note: "Most factories close for one to two weeks around Chinese New Year and take another one to two weeks to return to full output — the single biggest cause of missed deadlines in China sourcing.",
    });
    events.push({
      name: `Peak shipping season ${year}`,
      start: `${year}-08-15`,
      end: `${year}-10-15`,
      impact: "peak-season",
      note: "Freight rates rise and container space tightens as factories rush to ship before Christmas retail deadlines — book earlier than usual and expect less flexibility on price.",
    });
    events.push({
      name: `Golden Week ${year}`,
      start: `${year}-10-01`,
      end: `${year}-10-08`,
      impact: "closure",
      note: "China's National Day holiday — factories and customs offices close for about a week nationwide.",
    });
    events.push({
      name: `Labor Day holiday ${year}`,
      start: `${year}-04-29`,
      end: `${year}-05-05`,
      impact: "closure",
      note: "A shorter nationwide holiday, but it still closes factories and can add a few days to a production timeline.",
    });
  }
  return events;
}

export const CALENDAR_EVENTS = buildCalendarEvents();

export interface TimingResult {
  orderByDate: string;
  conflicts: CalendarEvent[];
  totalClosureDays: number;
  adjustedOrderByDate: string | null;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function planOrderTiming(targetDeliveryDate: string, leadTimeDays: number): TimingResult {
  const orderByDate = addDays(targetDeliveryDate, -leadTimeDays);
  const conflicts = CALENDAR_EVENTS.filter((e) => rangesOverlap(orderByDate, targetDeliveryDate, e.start, e.end));

  const closures = conflicts.filter((c) => c.impact === "closure");
  const totalClosureDays = closures.reduce((sum, c) => sum + daysBetween(c.start, c.end) + 1, 0);
  const adjustedOrderByDate = closures.length > 0 ? addDays(orderByDate, -totalClosureDays) : null;

  return { orderByDate, conflicts, totalClosureDays, adjustedOrderByDate };
}
