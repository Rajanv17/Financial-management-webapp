import { describe, expect, it } from "vitest";
import { getCurrentMonthIST, getMonthRangeIST } from "./period.util";

describe("getMonthRangeIST", () => {
  it("places 31 Oct 23:59 IST in October", () => {
    const { start, end } = getMonthRangeIST(10, 2026);
    const oct31_2359Ist = new Date("2026-10-31T18:29:00.000Z");
    expect(oct31_2359Ist.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(oct31_2359Ist.getTime()).toBeLessThan(end.getTime());
    expect(getCurrentMonthIST(oct31_2359Ist)).toEqual({
      month: 10,
      year: 2026,
    });
  });

  it("places 1 Nov 00:00 IST in November", () => {
    const october = getMonthRangeIST(10, 2026);
    const november = getMonthRangeIST(11, 2026);
    const nov1_0000Ist = new Date("2026-10-31T18:30:00.000Z");
    expect(nov1_0000Ist.getTime()).toBe(october.end.getTime());
    expect(nov1_0000Ist.getTime()).toBeGreaterThanOrEqual(november.start.getTime());
    expect(nov1_0000Ist.getTime()).toBeLessThan(november.end.getTime());
    expect(getCurrentMonthIST(nov1_0000Ist)).toEqual({
      month: 11,
      year: 2026,
    });
  });

  it("rolls December over to January of the next year", () => {
    const { start, end } = getMonthRangeIST(12, 2026);
    expect(start).toEqual(new Date("2026-11-30T18:30:00.000Z"));
    expect(end).toEqual(new Date("2026-12-31T18:30:00.000Z"));
    expect(getCurrentMonthIST(end)).toEqual({ month: 1, year: 2027 });
  });

  it("uses 29 days for February in a leap year (2028)", () => {
    const { start, end } = getMonthRangeIST(2, 2028);
    expect((end.getTime() - start.getTime()) / 86_400_000).toBe(29);
  });

  it("uses 28 days for February in a non-leap year (2027)", () => {
    const { start, end } = getMonthRangeIST(2, 2027);
    expect((end.getTime() - start.getTime()) / 86_400_000).toBe(28);
  });
});

describe("getCurrentMonthIST", () => {
  it("returns November at 2026-10-31T19:00:00Z (1 Nov 00:30 IST)", () => {
    expect(getCurrentMonthIST(new Date("2026-10-31T19:00:00.000Z"))).toEqual({
      month: 11,
      year: 2026,
    });
  });
});
