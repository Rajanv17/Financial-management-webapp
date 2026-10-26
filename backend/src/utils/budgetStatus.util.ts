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
