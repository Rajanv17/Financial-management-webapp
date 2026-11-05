import { Response } from "express";
import { prisma } from "../config";
import { AuthenticatedRequest } from "../middlewares";
import {
  ApiError,
  ApiResponse,
  budgetUsage,
  getMonthRangeIST,
  getPreviousMonth,
  spentChange,
  parseAmount,
  parseIntInRange,
  requireId,
  serializeAmount,
} from "../utils";
import { checkBudgetThresholdsSafe } from "../services";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

type DateRange = { start: Date; end: Date };

const getSpentByCategory = async (
  userId: string,
  categoryIds: string[],
  range: DateRange,
) => {
  if (categoryIds.length === 0) return new Map<string, number>();

  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "expense",
      date: { gte: range.start, lt: range.end },
      categoryId: { in: categoryIds },
    },
    _sum: { amount: true },
  });

  return new Map(
    rows.map((row) => [row.categoryId, Number(row._sum.amount ?? 0)]),
  );
};

const getTotalSpent = async (
  userId: string,
  categoryIds: string[],
  range: DateRange,
) => {
  if (categoryIds.length === 0) return 0;

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "expense",
      date: { gte: range.start, lt: range.end },
      categoryId: { in: categoryIds },
    },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
};

const createBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body;

  const categoryId = requireId(body.categoryId, "categoryId");
  const amount = parseAmount(body.amount, "Budget amount");
  const month = parseIntInRange(body.month, "Month", 1, 12);
  const year = parseIntInRange(body.year, "Year", 2000, 2100);

  if (body.period !== undefined && body.period !== "monthly") {
    throw new ApiError(400, "Only monthly budgets are supported");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isArchived: false,
      OR: [{ isDefault: true }, { userId }],
      type: "expense",
    },
  });

  if (!category) {
    throw new ApiError(404, "Expense category not found");
  }

  const existingBudget = await prisma.budget.findFirst({
    where: { userId, categoryId, month, year, isArchived: false },
  });

  if (existingBudget) {
    throw new ApiError(
      400,
      "Budget already exists for this category and month",
    );
  }

  try {
    const budget = await prisma.budget.create({
      data: { userId, categoryId, amount, month, year },
    });

    await checkBudgetThresholdsSafe({ userId, categoryId, month, year });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          serializeAmount(budget),
          "Budget created successfully",
        ),
      );
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(
        400,
        "Budget already exists for this category and month",
      );
    }
    throw error;
  }
};

const copyBudgets = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const month = parseIntInRange(req.body.month, "Month", 1, 12);
  const year = parseIntInRange(req.body.year, "Year", 2000, 2100);
  const source = getPreviousMonth(month, year);

  const [sourceBudgets, existing] = await Promise.all([
    prisma.budget.findMany({
      where: {
        userId,
        month: source.month,
        year: source.year,
        isArchived: false,
      },
      select: {
        categoryId: true,
        amount: true,
        isActive: true,
        category: { select: { isArchived: true } },
      },
    }),
    prisma.budget.findMany({
      where: { userId, month, year, isArchived: false },
      select: { categoryId: true },
    }),
  ]);

  const existingCategoryIds = new Set(existing.map((b) => b.categoryId));
  const toCreate = sourceBudgets.filter(
    (b) => !b.category.isArchived && !existingCategoryIds.has(b.categoryId),
  );

  const created =
    toCreate.length === 0
      ? 0
      : (
          await prisma.budget.createMany({
            data: toCreate.map((b) => ({
              userId,
              categoryId: b.categoryId,
              amount: b.amount,
              month,
              year,
              isActive: b.isActive,
            })),
            skipDuplicates: true,
          })
        ).count;

  const status = created > 0 ? 201 : 200;

  return res
    .status(status)
    .json(
      new ApiResponse(
        status,
        { created, skipped: sourceBudgets.length - created, month, year },
        created > 0 ? "Budgets copied successfully" : "No budgets to copy",
      ),
    );
};

const fetchBudgets = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const month = parseIntInRange(req.query.month, "Month", 1, 12);
  const year = parseIntInRange(req.query.year, "Year", 2000, 2100);
  const archivedParam = req.query.archived;
  if (
    archivedParam !== undefined &&
    archivedParam !== "true" &&
    archivedParam !== "false"
  ) {
    throw new ApiError(400, "archived must be true or false");
  }
  const archived = archivedParam === "true";

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year, isArchived: archived },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  if (budgets.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Budgets fetched successfully"));
  }

  const categoryIds = budgets.map((b) => b.categoryId);
  const previous = getPreviousMonth(month, year);

  const [spentByCategory, previousByCategory] = await Promise.all([
    getSpentByCategory(userId, categoryIds, getMonthRangeIST(month, year)),
    getSpentByCategory(
      userId,
      categoryIds,
      getMonthRangeIST(previous.month, previous.year),
    ),
  ]);

  const budgetsWithStats = budgets.map((budget) => {
    const amount = Number(budget.amount);
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    const previousSpent = previousByCategory.get(budget.categoryId) ?? 0;
    const { percentageUsed, status, remaining } = budgetUsage(spent, amount);

    return {
      ...budget,
      amount,
      spent,
      previousSpent,
      remaining,
      percentageUsed,
      status,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, budgetsWithStats, "Budgets fetched successfully"),
    );
};

const fetchBudgetSummary = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const month = parseIntInRange(req.query.month, "Month", 1, 12);
  const year = parseIntInRange(req.query.year, "Year", 2000, 2100);

  const where = {
    userId,
    month,
    year,
    isActive: true,
    isArchived: false,
  };

  const [budgetTotals, budgets] = await Promise.all([
    prisma.budget.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where,
      select: { categoryId: true },
    }),
  ]);

  const totalBudget = Number(budgetTotals._sum.amount ?? 0);
  const categoryIds = budgets.map((budget) => budget.categoryId);
  const previous = getPreviousMonth(month, year);

  const [totalSpent, previousTotalSpent] = await Promise.all([
    getTotalSpent(userId, categoryIds, getMonthRangeIST(month, year)),
    getTotalSpent(
      userId,
      categoryIds,
      getMonthRangeIST(previous.month, previous.year),
    ),
  ]);

  const { remaining, percentageUsed } =
    totalBudget === 0
      ? { remaining: 0, percentageUsed: 0 }
      : budgetUsage(totalSpent, totalBudget);

  const { spentDelta, spentDeltaPercent } = spentChange(
    totalSpent,
    previousTotalSpent,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalBudget,
        totalSpent,
        remaining,
        percentageUsed,
        previousTotalSpent,
        spentDelta,
        spentDeltaPercent,
      },
      "Budget summary fetched successfully",
    ),
  );
};

const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const id = requireId(req.params.id, "Budget id");
  const { amount, isActive } = req.body;

  const existingBudget = await prisma.budget.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!existingBudget) {
    throw new ApiError(404, "Budget not found");
  }

  const data = {
    ...(amount !== undefined && {
      amount: parseAmount(amount, "Budget amount"),
    }),
    ...(typeof isActive === "boolean" && { isActive }),
  };

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const budget = await prisma.budget.update({ where: { id }, data });

  await checkBudgetThresholdsSafe({
    userId,
    categoryId: budget.categoryId,
    month: budget.month,
    year: budget.year,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        serializeAmount(budget),
        "Budget updated successfully",
      ),
    );
};

const archiveBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const id = requireId(req.params.id, "Budget id");

  const existingBudget = await prisma.budget.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!existingBudget) {
    throw new ApiError(404, "Budget not found");
  }

  const budget = await prisma.budget.update({
    where: { id },
    data: { isArchived: true },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        serializeAmount(budget),
        "Budget archived successfully",
      ),
    );
};

const restoreBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const id = requireId(req.params.id, "Budget id");

  const existing = await prisma.budget.findFirst({
    where: { id, userId, isArchived: true },
    include: { category: { select: { isArchived: true } } },
  });

  if (!existing) {
    throw new ApiError(404, "Archived budget not found");
  }

  if (existing.category.isArchived) {
    throw new ApiError(
      400,
      "Restore the category before restoring this budget",
    );
  }

  const conflict = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: existing.categoryId,
      month: existing.month,
      year: existing.year,
      isArchived: false,
    },
  });

  if (conflict) {
    throw new ApiError(
      400,
      "An active budget already exists for this category and month",
    );
  }

  try {
    const budget = await prisma.budget.update({
      where: { id },
      data: { isArchived: false },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          serializeAmount(budget),
          "Budget restored successfully",
        ),
      );
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(
        400,
        "An active budget already exists for this category and month",
      );
    }
    throw error;
  }
};

export {
  createBudget,
  copyBudgets,
  fetchBudgets,
  fetchBudgetSummary,
  updateBudget,
  archiveBudget,
  restoreBudget,
};
