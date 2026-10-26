/** India Standard Time is UTC+05:30 and does not observe DST. */
const IST_OFFSET_MS = 330 * 60_000;

const nextCalendarMonth = (month: number, year: number) =>
  month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

/** Inclusive start and exclusive end of the calendar month in IST, as UTC instants. */
export const getMonthRangeIST = (month: number, year: number) => {
  const start = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
  const next = nextCalendarMonth(month, year);
  const end = new Date(Date.UTC(next.year, next.month - 1, 1) - IST_OFFSET_MS);
  return { start, end };
};

export const getCurrentMonthIST = (now = new Date()) => {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    month: shifted.getUTCMonth() + 1,
    year: shifted.getUTCFullYear(),
  };
};
