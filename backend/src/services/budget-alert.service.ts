import { prisma } from "../config";
import {
  budgetUsage,
  getMonthRangeIST,
  notificationKeys,
  formatInr,
} from "../utils";
import { createNotification } from "./index";

type Db = NonNullable<Parameters<typeof createNotification>[1]>;

export function istYearMonth(date: Date): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month") };
}

interface CheckParams {
  userId: string;
  categoryId: string;
  month: number;
  year: number;
}

/**
 * Creates a near-limit or exceeded notification if the active budget for
 * (category, month) has crossed a threshold. Idempotent via dedupe keys.
 * Returns the budget status, or null if there is no active budget.
 */
export async function checkBudgetThresholds(
  { userId, categoryId, month, year }: CheckParams,
  db: Db = prisma,
) {
  const budget = await db.budget.findFirst({
    where: {
      userId,
      categoryId,
      month,
      year,
      isActive: true,
      isArchived: false,
    },
    include: { category: { select: { name: true } } },
  });
  if (!budget) return null;

  const { start, end } = getMonthRangeIST(month, year);
  const agg = await db.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "expense",
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  const spent = Number(agg._sum.amount ?? 0);
  const limit = Number(budget.amount);
  const { status, percentageUsed } = budgetUsage(spent, limit);
  const name = budget.category.name;
  const data = { budgetId: budget.id, categoryId, month, year };

  if (status === "exceeded") {
    await createNotification(
      {
        userId,
        type: "budget_exceeded",
        title: `${name} budget exceeded`,
        message: `You've spent ${formatInr(spent)} against a ${formatInr(limit)} limit on ${name} this month (over by ${formatInr(spent - limit)}).`,
        dedupeKey: notificationKeys.budgetExceeded(budget.id),
        data,
      },
      db,
    );
  } else if (status === "near_limit") {
    await createNotification(
      {
        userId,
        type: "budget_near_limit",
        title: `${name} budget is at ${Math.round(percentageUsed)}%`,
        message: `You've spent ${formatInr(spent)} of ${formatInr(limit)} on ${name} this month.`,
        dedupeKey: notificationKeys.budgetNearLimit(budget.id),
        data,
      },
      db,
    );
  }

  return status;
}

export async function checkBudgetThresholdsSafe(params: CheckParams) {
  try {
    await checkBudgetThresholds(params);
  } catch (error) {
    console.error("Budget threshold check failed", error);
  }
}
