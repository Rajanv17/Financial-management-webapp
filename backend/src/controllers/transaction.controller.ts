import { Response } from "express";
import { prisma } from "../config";
import {
  ApiError,
  ApiResponse,
  optionalString,
  parseAmount,
  parseDate,
  parseEnum,
  requireId,
  requireString,
  serializeAmount,
} from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import { PaymentMethod, TransactionType } from "../generated/prisma/enums";

const TRANSACTION_TYPES = Object.values(TransactionType);
const PAYMENT_METHODS = Object.values(PaymentMethod);

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

const assertUsableCategory = async (userId: string, categoryId: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isArchived: false,
      OR: [{ isDefault: true }, { userId }],
    },
  });

  if (!category) {
    throw new ApiError(400, "Invalid or archived category");
  }
};

const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body;

  const title = requireString(body.title, "Title", 100);
  const amount = parseAmount(body.amount);
  const type = parseEnum(body.type, TRANSACTION_TYPES, "Type");
  const categoryId = requireId(body.categoryId, "categoryId");
  const date = body.date ? parseDate(body.date) : new Date();
  const description = optionalString(body.description, "Description", 150);
  const paymentMethod = body.paymentMethod
    ? parseEnum(body.paymentMethod, PAYMENT_METHODS, "Payment method")
    : PaymentMethod.CASH;

  await assertUsableCategory(userId, categoryId);

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      title,
      amount,
      type,
      date,
      categoryId,
      description,
      paymentMethod,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        serializeAmount(transaction),
        "Transaction created successfully",
      ),
    );
};

const fetchTransactions = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transactions.map(serializeAmount),
        "Transactions fetched successfully",
      ),
    );
};

const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const transactionId = requireId(req.params.id, "Transaction id");
  const body = req.body;

  const existingTransaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existingTransaction) {
    throw new ApiError(404, "Transaction not found");
  }

  const data = {
    ...(body.title !== undefined && {
      title: requireString(body.title, "Title", 100),
    }),
    ...(body.amount !== undefined && { amount: parseAmount(body.amount) }),
    ...(body.type !== undefined && {
      type: parseEnum(body.type, TRANSACTION_TYPES, "Type"),
    }),
    ...(body.date !== undefined && { date: parseDate(body.date) }),
    ...(body.categoryId !== undefined && {
      categoryId: requireId(body.categoryId, "categoryId"),
    }),
    ...(body.description !== undefined && {
      description: optionalString(body.description, "Description", 150),
    }),
    ...(body.paymentMethod !== undefined && {
      paymentMethod: parseEnum(
        body.paymentMethod,
        PAYMENT_METHODS,
        "Payment method",
      ),
    }),
  };

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  if (data.categoryId && data.categoryId !== existingTransaction.categoryId) {
    await assertUsableCategory(userId, data.categoryId);
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        serializeAmount(transaction),
        "Transaction updated successfully",
      ),
    );
};

const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const transactionId = requireId(req.params.id, "Transaction id");

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  await prisma.transaction.delete({ where: { id: transactionId } });

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
