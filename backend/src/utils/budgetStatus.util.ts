export type BudgetStatus = "under_limit" | "near_limit" | "exceeded";

const toPaise = (value: number) => Math.round(value * 100);

export const budgetUsage = (spent: number, amount: number) => {
  const spentPaise = toPaise(spent);
  const amountPaise = toPaise(amount);

  if (amountPaise <= 0) {
    return {
      percentageUsed: 0,
      status: "under_limit" as BudgetStatus,
      remaining: 0,
    };
  }

  const status: BudgetStatus =
    spentPaise > amountPaise
      ? "exceeded"
      : spentPaise * 100 >= amountPaise * 80
        ? "near_limit"
        : "under_limit";

  return {
    percentageUsed: Math.floor((spentPaise * 100) / amountPaise),
    status,
    remaining: (amountPaise - spentPaise) / 100,
  };
};

export const spentChange = (current: number, previous: number) => {
  const currentPaise = Math.round(current * 100);
  const previousPaise = Math.round(previous * 100);
  const deltaPaise = currentPaise - previousPaise;

  return {
    spentDelta: deltaPaise / 100,
    // null when there is no previous spend to compare against
    spentDeltaPercent:
      previousPaise > 0 ? Math.round((deltaPaise * 100) / previousPaise) : null,
  };
};
