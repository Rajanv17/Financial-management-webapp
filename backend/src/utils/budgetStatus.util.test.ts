import { describe, expect, it } from "vitest";
import { budgetUsage } from "./budgetStatus.util";

describe("budgetUsage", () => {
  it("marks 79% as under_limit", () => {
    expect(budgetUsage(79, 100)).toEqual({
      percentageUsed: 79,
      status: "under_limit",
      remaining: 21,
    });
  });

  it("marks 80% as near_limit", () => {
    expect(budgetUsage(80, 100)).toEqual({
      percentageUsed: 80,
      status: "near_limit",
      remaining: 20,
    });
  });

  it("marks 99% as near_limit", () => {
    expect(budgetUsage(99, 100)).toEqual({
      percentageUsed: 99,
      status: "near_limit",
      remaining: 1,
    });
  });

  it("marks 100% as exceeded", () => {
    expect(budgetUsage(100, 100)).toEqual({
      percentageUsed: 100,
      status: "exceeded",
      remaining: 0,
    });
  });

  it("marks 120% as exceeded and does not cap percentageUsed", () => {
    expect(budgetUsage(120, 100)).toEqual({
      percentageUsed: 120,
      status: "exceeded",
      remaining: -20,
    });
  });
});
