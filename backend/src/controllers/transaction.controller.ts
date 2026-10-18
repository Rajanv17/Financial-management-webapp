import { Response } from "express";
import { prisma } from "../config";
import {
  ApiError,
  ApiResponse,
  optionalQueryString,
  optionalString,
  parseAmount,
  parseDate,
  parseEnum,
  parseInclusiveDate,
  parseIntInRange,
  requireId,
  requireString,
  serializeAmount,
} from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import { PaymentMethod, TransactionType } from "../generated/prisma/enums";

const TRANSACTION_TYPES = Object.values(TransactionType);
const PAYMENT_METHODS = Object.values(PaymentMethod);
const SORT_FIELDS = ["date", "amount", "title"] as const;
const SORT_ORDERS = ["asc", "desc"] as const;
const CATEGORY_SELECT = {
  id: true,
  name: true,
  icon: true,
  color: true,
  type: true,
} as const;

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

  return category;
};

const assertTypeMatchesCategory = (
  type: TransactionType,
  categoryType: TransactionType,
) => {
  if (type !== categoryType) {
    throw new ApiError(400, "Transaction type must match the category type");
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

  const category = await assertUsableCategory(userId, categoryId);
  assertTypeMatchesCategory(type, category.type);

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
  const query = req.query;

  const pageValue = optionalQueryString(query.page, "page");
  const limitValue = optionalQueryString(query.limit, "limit");
  const page = pageValue === undefined ? 1 : parseIntInRange(pageValue, "page", 1, 1_000_000);
  const limit =
    limitValue === undefined ? 20 : parseIntInRange(limitValue, "limit", 1, 100);

  const typeValue = optionalQueryString(query.type, "type");
  const type =
    typeValue === undefined
      ? undefined
      : parseEnum(typeValue, TRANSACTION_TYPES, "type");

  const categoryIdValue = optionalQueryString(query.categoryId, "categoryId");
  const categoryId =
    categoryIdValue === undefined
      ? undefined
      : requireId(categoryIdValue, "categoryId");

  const fromValue = optionalQueryString(query.from, "from");
  const toValue = optionalQueryString(query.to, "to");
  const from =
    fromValue === undefined
      ? undefined
      : parseInclusiveDate(fromValue, "from", "start");
  const to =
    toValue === undefined
      ? undefined
      : parseInclusiveDate(toValue, "to", "end");

  if (from && to && from.getTime() > to.getTime()) {
    throw new ApiError(400, "from must be before or equal to to");
  }

  const qValue = optionalQueryString(query.q, "q");
  const q = qValue === undefined ? undefined : qValue.trim();

  const sortByValue = optionalQueryString(query.sortBy, "sortBy");
  const sortBy =
    sortByValue === undefined
      ? "date"
      : parseEnum(sortByValue, SORT_FIELDS, "sortBy");

  const sortOrderValue = optionalQueryString(query.sortOrder, "sortOrder");
  const sortOrder =
    sortOrderValue === undefined
      ? "desc"
      : parseEnum(sortOrderValue, SORT_ORDERS, "sortOrder");

  const where = {
    userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(from || to
      ? { date: { ...(from && { gte: from }), ...(to && { lte: to }) } }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, transactions] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: CATEGORY_SELECT } },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: transactions.map(serializeAmount),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
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

  const nextType = data.type ?? existingTransaction.type;
  const nextCategoryId = data.categoryId ?? existingTransaction.categoryId;

  if (data.type !== undefined || data.categoryId !== undefined) {
    const category =
      data.categoryId && data.categoryId !== existingTransaction.categoryId
        ? await assertUsableCategory(userId, data.categoryId)
        : await prisma.category.findFirst({
            where: {
              id: nextCategoryId,
              OR: [{ isDefault: true }, { userId }],
            },
          });

    if (!category) {
      throw new ApiError(400, "Invalid or archived category");
    }

    assertTypeMatchesCategory(nextType, category.type);
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
