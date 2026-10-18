import type { PeriodId } from "./types";

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "this_year", label: "This year" },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatYmd = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const lastDayOfMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

export const periodRange = (period: PeriodId, now = new Date()) => {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  if (period === "this_month") {
    return {
      from: formatYmd(year, monthIndex, 1),
      to: formatYmd(year, monthIndex, lastDayOfMonth(year, monthIndex)),
    };
  }

  if (period === "last_month") {
    const start = new Date(year, monthIndex - 1, 1);
    const y = start.getFullYear();
    const m = start.getMonth();
    return {
      from: formatYmd(y, m, 1),
      to: formatYmd(y, m, lastDayOfMonth(y, m)),
    };
  }

  if (period === "last_3_months") {
    const start = new Date(year, monthIndex - 2, 1);
    return {
      from: formatYmd(start.getFullYear(), start.getMonth(), 1),
      to: formatYmd(year, monthIndex, lastDayOfMonth(year, monthIndex)),
    };
  }

  return {
    from: formatYmd(year, 0, 1),
    to: formatYmd(year, 11, 31),
  };
};

export const currentBudgetPeriod = (now = new Date()) => ({
  month: now.getMonth() + 1,
  year: now.getFullYear(),
});
