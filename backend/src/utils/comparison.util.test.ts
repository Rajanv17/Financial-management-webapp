import { describe, expect, it } from "vitest";
import { getPreviousMonth } from "./period.util";
import { spentChange } from "./budgetStatus.util";

describe("getPreviousMonth", () => {
  it("steps back within a year", () => {
    expect(getPreviousMonth(6, 2026)).toEqual({ month: 5, year: 2026 });
  });

  it("wraps January to December of the previous year", () => {
    expect(getPreviousMonth(1, 2027)).toEqual({ month: 12, year: 2026 });
  });
});

describe("spentChange", () => {
  it("reports an increase", () => {
    expect(spentChange(450, 300)).toEqual({
      spentDelta: 150,
      spentDeltaPercent: 50,
    });
  });

  it("reports a decrease as negative", () => {
    expect(spentChange(100, 200)).toEqual({
      spentDelta: -100,
      spentDeltaPercent: -50,
    });
  });

  it("returns a null percent when there was no previous spend", () => {
    expect(spentChange(80, 0)).toEqual({
      spentDelta: 80,
      spentDeltaPercent: null,
    });
  });

  it("is exact for float-prone values", () => {
    expect(spentChange(0.3, 0.1).spentDelta).toBe(0.2);
  });
});
