import { Response } from "express";
import { prisma } from "../config";
import { AuthenticatedRequest } from "../middlewares";
import {
  ApiError,
  ApiResponse,
  optionalQueryString,
  parseInclusiveDate,
} from "../utils";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

const requireQueryDate = (
  value: unknown,
  field: string,
  bound: "start" | "end",
) => {
  const raw = optionalQueryString(value, field);
  if (raw === undefined) {
    throw new ApiError(400, `${field} is required`);
  }
  return parseInclusiveDate(raw, field, bound);
};

const toAmount = (value: unknown): number => Number(value ?? 0);

const monthsInRange = (from: Date, to: Date): string[] => {
  const months: string[] = [];
  let year = from.getUTCFullYear();
  let month = from.getUTCMonth();
  const endYear = to.getUTCFullYear();
  const endMonth = to.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
  }
  return months;
};

const fetchDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const from = requireQueryDate(req.query.from, "from", "start");
  const to = requireQueryDate(req.query.to, "to", "end");

  if (from.getTime() > to.getTime()) {
    throw new ApiError(400, "from must be before or equal to to");
  }

  const dateFilter = { gte: from, lte: to };

  const [totalsRows, categoryRows, monthlyRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: dateFilter },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: dateFilter },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.$queryRaw<
      { month: string; income: unknown; expense: unknown }[]
    >`
      SELECT
        to_char(date_trunc('month', date AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
      FROM transactions
      WHERE user_id = ${userId}::uuid
        AND date >= ${from}
        AND date <= ${to}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const income = toAmount(
    totalsRows.find((row) => row.type === "income")?._sum.amount,
  );
  const expense = toAmount(
    totalsRows.find((row) => row.type === "expense")?._sum.amount,
  );

  const categoryIds = categoryRows.map((row) => row.categoryId);
  const categories =
    categoryIds.length === 0
      ? []
      : await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, color: true },
        });
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const byCategory = categoryRows.map((row) => {
    const total = toAmount(row._sum.amount);
    const category = categoryById.get(row.categoryId);
    return {
      categoryId: row.categoryId,
      name: category?.name ?? "",
      color: category?.color ?? null,
      total,
      percent: expense === 0 ? 0 : Math.round((total / expense) * 100),
    };
  });

  const monthlyTotals = new Map(
    monthlyRows.map((row) => [
      row.month,
      { income: toAmount(row.income), expense: toAmount(row.expense) },
    ]),
  );

  const monthly = monthsInRange(from, to).map((month) => ({
    month,
    income: monthlyTotals.get(month)?.income ?? 0,
    expense: monthlyTotals.get(month)?.expense ?? 0,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totals: { income, expense, net: income - expense },
        byCategory,
        monthly,
      },
      "Dashboard summary fetched successfully",
    ),
  );
};

export { fetchDashboardSummary };
