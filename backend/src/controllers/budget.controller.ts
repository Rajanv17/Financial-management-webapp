import { Response } from "express";
import { prisma } from "../config";
import { AuthenticatedRequest } from "../middlewares";
import { ApiError, ApiResponse, budgetUsage } from "../utils";
import {
  parseAmount,
  parseIntInRange,
  requireId,
  serializeAmount,
} from "../utils";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

const createBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body;

  const categoryId = requireId(body.categoryId, "categoryId");
  const amount = parseAmount(body.amount, "Budget amount");
  const month = parseIntInRange(body.month, "Month", 1, 12);
  const year = parseIntInRange(body.year, "Year", 2000, 2100);

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

const fetchBudgets = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const month = parseIntInRange(req.query.month, "Month", 1, 12);
  const year = parseIntInRange(req.query.year, "Year", 2000, 2100);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year, isArchived: false },
    include: { category: true },
  });

  if (budgets.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Budgets fetched successfully"));
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const spentRows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "expense",
      date: { gte: start, lt: end },
      categoryId: { in: budgets.map((b) => b.categoryId) },
    },
    _sum: { amount: true },
  });

  const spentByCategory = new Map(
    spentRows.map((row) => [row.categoryId, Number(row._sum.amount ?? 0)]),
  );

  const budgetsWithStats = budgets.map((budget) => {
    const amount = Number(budget.amount);
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    const { percentageUsed, status, remaining } = budgetUsage(spent, amount);

    return {
      ...budget,
      amount,
      spent,
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

export { createBudget, fetchBudgets, updateBudget, archiveBudget };
