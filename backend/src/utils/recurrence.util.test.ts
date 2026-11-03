import { describe, expect, it } from "vitest";
import { nextOccurrenceAfter, occurrenceAt, todayIST } from "./recurrence.util";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("occurrenceAt", () => {
  it("weekly: adds 7 days per step, across month boundaries", () => {
    const start = d("2026-01-05");
    expect(iso(occurrenceAt(start, "weekly", 0))).toBe("2026-01-05");
    expect(iso(occurrenceAt(start, "weekly", 1))).toBe("2026-01-12");
    expect(iso(occurrenceAt(start, "weekly", 4))).toBe("2026-02-02");
  });

  it("monthly from the 31st: clamps, then returns to the 31st", () => {
    const start = d("2026-01-31");
    expect(iso(occurrenceAt(start, "monthly", 1))).toBe("2026-02-28");
    expect(iso(occurrenceAt(start, "monthly", 2))).toBe("2026-03-31");
    expect(iso(occurrenceAt(start, "monthly", 3))).toBe("2026-04-30");
  });

  it("monthly from the 31st: uses Feb 29 in a leap year", () => {
    expect(iso(occurrenceAt(d("2028-01-31"), "monthly", 1))).toBe("2028-02-29");
  });

  it("monthly from the 30th", () => {
    const start = d("2026-01-30");
    expect(iso(occurrenceAt(start, "monthly", 1))).toBe("2026-02-28");
    expect(iso(occurrenceAt(start, "monthly", 2))).toBe("2026-03-30");
  });

  it("monthly: rolls over the year", () => {
    expect(iso(occurrenceAt(d("2026-11-15"), "monthly", 3))).toBe("2027-02-15");
  });

  it("yearly from Feb 29: clamps to Feb 28, returns to Feb 29 in leap years", () => {
    const start = d("2028-02-29");
    expect(iso(occurrenceAt(start, "yearly", 1))).toBe("2029-02-28");
    expect(iso(occurrenceAt(start, "yearly", 4))).toBe("2032-02-29");
  });

  it("rejects invalid n", () => {
    expect(() => occurrenceAt(d("2026-01-01"), "weekly", -1)).toThrow(
      RangeError,
    );
    expect(() => occurrenceAt(d("2026-01-01"), "weekly", 1.5)).toThrow(
      RangeError,
    );
  });
});

describe("nextOccurrenceAfter", () => {
  it("monthly, months overdue: returns the first occurrence after the date", () => {
    // Jan31, Feb28, Mar31, Apr30, May31, Jun30
    expect(
      iso(nextOccurrenceAfter(d("2026-01-31"), "monthly", d("2026-06-15"))),
    ).toBe("2026-06-30");
  });

  it("is strictly after: an exact match moves to the next occurrence", () => {
    expect(
      iso(nextOccurrenceAfter(d("2026-01-31"), "monthly", d("2026-06-30"))),
    ).toBe("2026-07-31");
  });

  it("weekly, months overdue", () => {
    expect(
      iso(nextOccurrenceAfter(d("2026-01-05"), "weekly", d("2026-03-01"))),
    ).toBe("2026-03-02");
  });

  it("yearly, years overdue, with leap-day start", () => {
    expect(
      iso(nextOccurrenceAfter(d("2028-02-29"), "yearly", d("2031-06-01"))),
    ).toBe("2032-02-29");
  });

  it("returns startDate when afterDate is before it", () => {
    expect(
      iso(nextOccurrenceAfter(d("2026-05-10"), "monthly", d("2026-01-01"))),
    ).toBe("2026-05-10");
  });
});

describe("todayIST", () => {
  it("rolls to the next IST date after 18:30 UTC", () => {
    expect(iso(todayIST(new Date("2026-11-03T20:00:00.000Z")))).toBe(
      "2026-11-04",
    );
    expect(iso(todayIST(new Date("2026-11-03T10:00:00.000Z")))).toBe(
      "2026-11-03",
    );
  });
});
