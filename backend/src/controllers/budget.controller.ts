import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares";
import { ApiError, ApiResponse } from "../utils";
import { BudgetModel, CategoryModel, TransactionModel } from "../models";
import mongoose from "mongoose";

const createBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { categoryId, amount, month, year } = req.body;

  if (!categoryId || !amount || !month || !year) {
    throw new ApiError(400, "All fields are required");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Budget amount must be greater than zero");
  }

  const category = await CategoryModel.findOne({
    _id: categoryId,
    $or: [{ isDefault: true }, { userId }],
    type: "expense",
  });

  if (!category) {
    throw new ApiError(404, "Expense category not found");
  }

  const existingBudget = await BudgetModel.findOne({
    userId,
    categoryId,
    month,
    year,
    isArchived: false,
  });

  if (existingBudget) {
    throw new ApiError(
      400,
      "Budget already exists for this category and month",
    );
  }

  const budget = await BudgetModel.create({
    userId,
    categoryId,
    amount,
    month,
    year,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, budget, "Budget created successfully"));
};

const fetchBudgets = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    throw new ApiError(400, "Month and year are required");
  }

  const budgets = await BudgetModel.find({
    userId,
    month,

    year,
    isArchived: false,
  }).populate("categoryId");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const budgetsWithStats = await Promise.all(
    budgets.map(async (budget) => {
      const spentResult = await TransactionModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            categoryId: budget.categoryId._id,
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const spent = spentResult[0]?.total || 0;
      const remaining = budget.amount - spent;
      const percentageUsed = Math.min(
        Math.round((spent / budget.amount) * 100),
        100,
      );

      let status: "under_limit" | "near_limit" | "exceeded" = "under_limit";
      if (percentageUsed >= 90 && percentageUsed < 100) status = "near_limit";
      if (percentageUsed >= 100) status = "exceeded";

      return {
        ...budget.toObject(),
        spent,
        remaining,
        percentageUsed,
        status,
      };
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, budgetsWithStats, "Budgets fetched successfully"),
    );
};

const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { amount, isActive } = req.body;

  const budget = await BudgetModel.findOne({
    _id: id,
    userId,
    isArchived: false,
  });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  if (amount !== undefined) {
    if (amount <= 0) {
      throw new ApiError(400, "Budget amount must be greater than zero");
    }
    budget.amount = amount;
  }

  if (typeof isActive === "boolean") {
    budget.isActive = isActive;
  }

  await budget.save();

  return res
    .status(200)
    .json(new ApiResponse(200, budget, "Budget updated successfully"));
};

const archiveBudget = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const budget = await BudgetModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isArchived: true } },
    { new: true },
  );

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Budget deleted successfully"));
};

export { createBudget, fetchBudgets, updateBudget, archiveBudget };
