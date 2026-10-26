import { describe, expect, it } from "vitest";
import { budgetUsage } from "./budgetStatus.util";

describe("budgetUsage", () => {
  it("marks 79.99% as under_limit", () => {
    expect(budgetUsage(79.99, 100)).toEqual({
      percentageUsed: 79,
      status: "under_limit",
      remaining: 20.01,
    });
  });

  it("marks 80.00% as near_limit", () => {
    expect(budgetUsage(80, 100)).toEqual({
      percentageUsed: 80,
      status: "near_limit",
      remaining: 20,
    });
  });

  it("floors 99.6% to 99 and marks near_limit", () => {
    expect(budgetUsage(99.6, 100)).toEqual({
      percentageUsed: 99,
      status: "near_limit",
      remaining: 0.4,
    });
  });

  it("marks spent equal to the limit as near_limit with remaining 0", () => {
    expect(budgetUsage(100, 100)).toEqual({
      percentageUsed: 100,
      status: "near_limit",
      remaining: 0,
    });
  });

  it("marks spent above the limit as exceeded with negative remaining", () => {
    expect(budgetUsage(120, 100)).toEqual({
      percentageUsed: 120,
      status: "exceeded",
      remaining: -20,
    });
  });

  it("returns zeros when the amount is 0", () => {
    expect(budgetUsage(50, 0)).toEqual({
      percentageUsed: 0,
      status: "under_limit",
      remaining: 0,
    });
  });

  it("uses paise rounding so 0.1 + 0.2 matches 0.3", () => {
    expect(budgetUsage(0.1 + 0.2, 0.3)).toEqual({
      percentageUsed: 100,
      status: "near_limit",
      remaining: 0,
    });
  });
});
