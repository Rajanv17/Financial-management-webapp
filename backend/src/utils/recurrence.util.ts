// Pure calendar-date math for recurring payments.
// Dates are UTC-midnight Date objects, which is how Prisma returns @db.Date columns.
// No timezone or library involved: only UTC getters/setters.

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function daysInMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month = last day of this month.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonthsClamped(start: Date, months: number): Date {
  const totalMonths = start.getUTCMonth() + months;
  const year = start.getUTCFullYear() + Math.floor(totalMonths / 12);
  const monthIndex = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(start.getUTCDate(), daysInMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
}

/**
 * The n-th occurrence (n = 0 is startDate itself), always computed from
 * startDate so month-end clamping never causes permanent drift.
 */
export function occurrenceAt(
  startDate: Date,
  frequency: RecurrenceFrequency,
  n: number,
): Date {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("n must be a non-negative integer");
  }

  switch (frequency) {
    case "weekly":
      return new Date(startDate.getTime() + n * 7 * MS_PER_DAY);
    case "monthly":
      return addMonthsClamped(startDate, n);
    case "yearly":
      return addMonthsClamped(startDate, n * 12);
  }
}

/**
 * The first occurrence strictly after `afterDate`.
 * If afterDate is before startDate, that is startDate.
 */
export function nextOccurrenceAfter(
  startDate: Date,
  frequency: RecurrenceFrequency,
  afterDate: Date,
): Date {
  // Estimate n, then step back one and walk forward. Cheap even if months overdue.
  let estimate: number;
  switch (frequency) {
    case "weekly":
      estimate = Math.floor(
        (afterDate.getTime() - startDate.getTime()) / (7 * MS_PER_DAY),
      );
      break;
    case "monthly":
      estimate =
        (afterDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
        (afterDate.getUTCMonth() - startDate.getUTCMonth());
      break;
    case "yearly":
      estimate = afterDate.getUTCFullYear() - startDate.getUTCFullYear();
      break;
  }

  let n = Math.max(0, estimate - 1);
  while (
    occurrenceAt(startDate, frequency, n).getTime() <= afterDate.getTime()
  ) {
    n++;
  }
  return occurrenceAt(startDate, frequency, n);
}

/** Today's calendar date in IST, as a UTC-midnight Date (same shape as a @db.Date column). */
export function todayIST(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()),
  );
}

/** The instant of 00:00 IST on a calendar date. Used as the generated transaction's date. */
export function istMidnight(date: Date): Date {
  return new Date(date.getTime() - IST_OFFSET_MS);
}
