import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import {
  PaymentMethod,
  TransactionModel,
  CategoryModel,
} from "../models/index";

const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const { title, amount, type, date, categoryId, description, paymentMethod } =
    req.body;

  if ([title, type].some((field) => field?.trim() === "")) {
    throw new ApiError(
      400,
      "All fields except description and payment method are required",
    );
  }

  const categoryExist = await CategoryModel.findOne({
    _id: categoryId,
    $or: [{ isDefault: true }, { userId: req.user?.id }],
  });

  if (!categoryExist) {
    throw new ApiError(400, "Invalid categoryId");
  }

  const transaction = await TransactionModel.create({
    userId: req.user?.id,
    title,
    amount,
    type,
    date: date || new Date(),
    categoryId,
    description,
    paymentMethod: paymentMethod || PaymentMethod.CASH,
  });

  if (!transaction) {
    throw new ApiError(500, "Something went wrong while creating transaction");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, transaction, "Transaction created successfully"),
    );
};

const fetchTransactions = async (req: AuthenticatedRequest, res: Response) => {
  const transactions = await TransactionModel.find({
    userId: req.user?.id,
  }).sort({ date: -1 });

  if (!transactions) {
    throw new ApiError(404, "No transactions found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, transactions, "Transactions fetched successfully"),
    );
};

const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const transactionId = req.params.id;
  const { title, amount, type, date, categoryId, description, paymentMethod } =
    req.body;

  const transaction = await TransactionModel.findByIdAndUpdate(
    {
      _id: transactionId,
      userId: req.user?.id,
    },
    {
      title,
      amount,
      type,
      date,
      categoryId,
      description,
      paymentMethod,
    },
    { new: true },
  );

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, transaction, "Transaction updated successfully"),
    );
};

const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const transactionId = req.params.id;

  const transaction = await TransactionModel.findOneAndDelete({
    _id: transactionId,
    userId: req.user?.id,
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Transaction deleted successfully"));
};

export {
  createTransaction,
  fetchTransactions,
  updateTransaction,
  deleteTransaction,
};
