export type BudgetStatus = "under_limit" | "near_limit" | "exceeded";

export const budgetUsage = (spent: number, amount: number) => {
  const percentageUsed = Math.round((spent / amount) * 100);

  const status: BudgetStatus =
    percentageUsed >= 100
      ? "exceeded"
      : percentageUsed >= 80
        ? "near_limit"
        : "under_limit";

  return {
    percentageUsed,
    status,
    remaining: amount - spent,
  };
};
