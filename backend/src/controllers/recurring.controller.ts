import { Response } from "express";
import { prisma } from "../config";
import {
  ApiError,
  ApiResponse,
  optionalQueryString,
  optionalString,
  parseEnum,
  requireId,
  requireString,
} from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import { RecurringFrequency, TransactionType } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { nextOccurrenceAfter, todayIST } from "../utils/recurrence.util";

const FREQUENCIES = Object.values(RecurringFrequency);
const TRANSACTION_TYPES = Object.values(TransactionType);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const include = {
  account: { select: { id: true, name: true, type: true } },
  category: { select: { id: true, name: true } },
} satisfies Prisma.RecurringPaymentInclude;

type Row = Prisma.RecurringPaymentGetPayload<{ include: typeof include }>;

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");
  return userId;
};

// Positive money, up to 10 integer digits and 2 decimals.
const parseAmount = (value: unknown): string => {
  const text = String(value ?? "").trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text) || Number(text) <= 0) {
    throw new ApiError(
      400,
      "Amount must be a positive number with at most 2 decimal places",
    );
  }
  return text;
};

// "YYYY-MM-DD" -> UTC-midnight Date (the shape of a @db.Date column).
const parseDateOnly = (value: unknown, label: string): Date => {
  const text = String(value ?? "").trim();
  const date = new Date(`${text}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    throw new ApiError(400, `${label} must be a date in YYYY-MM-DD format`);
  }
  return date;
};

const ymd = (date: Date) => date.toISOString().slice(0, 10);

const serialize = (p: Row) => ({
  id: p.id,
  name: p.name,
  type: p.type,
  amount: Number(p.amount.toFixed(2)),
  frequency: p.frequency,
  startDate: ymd(p.startDate),
  nextDueDate: ymd(p.nextDueDate),
  endDate: p.endDate ? ymd(p.endDate) : null,
  isActive: p.isActive,
  accountId: p.accountId,
  categoryId: p.categoryId,
  account: p.account,
  category: p.category,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const assertUsableAccount = async (userId: string, accountId: string) => {
  const account = await prisma.financialAccount.findFirst({
    where: { id: accountId, userId, isArchived: false },
    select: { id: true },
  });
  if (!account) throw new ApiError(400, "Invalid or archived account");
};

const assertUsableCategory = async (
  userId: string,
  categoryId: string,
  type: TransactionType,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isArchived: false,
      OR: [{ userId }, { userId: null }],
    },
    select: { type: true },
  });
  if (!category) throw new ApiError(400, "Invalid or archived category");
  if (category.type !== type) {
    throw new ApiError(400, "Payment type must match the category type");
  }
};

const findOwned = async (userId: string, id: string) => {
  const payment = await prisma.recurringPayment.findFirst({
    where: { id, userId },
    include,
  });
  if (!payment) throw new ApiError(404, "Recurring payment not found");
  return payment;
};

const parsePaging = (req: AuthenticatedRequest) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const createRecurringPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const body = req.body;

  const name = requireString(body.name, "Name", 100);
  const type = parseEnum(body.type, TRANSACTION_TYPES, "Type");
  const amount = parseAmount(body.amount);
  const frequency = parseEnum(body.frequency, FREQUENCIES, "Frequency");
  const startDate = parseDateOnly(body.startDate, "Start date");
  const endDate =
    body.endDate !== undefined && body.endDate !== null
      ? parseDateOnly(body.endDate, "End date")
      : null;
  const accountId = requireId(body.accountId, "Account id");
  const categoryId = requireId(body.categoryId, "Category id");

  if (startDate.getTime() < todayIST().getTime()) {
    throw new ApiError(400, "Start date cannot be in the past");
  }
  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw new ApiError(400, "End date cannot be before the start date");
  }

  await assertUsableAccount(userId, accountId);
  await assertUsableCategory(userId, categoryId, type);

  const payment = await prisma.recurringPayment.create({
    data: {
      userId,
      accountId,
      categoryId,
      name,
      type,
      amount,
      frequency,
      startDate,
      nextDueDate: startDate,
      endDate,
    },
    include,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        serialize(payment),
        "Recurring payment created successfully",
      ),
    );
};

const fetchRecurringPayments = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const activeValue = optionalQueryString(req.query.isActive, "isActive");
  if (
    activeValue !== undefined &&
    activeValue !== "true" &&
    activeValue !== "false"
  ) {
    throw new ApiError(400, "isActive must be true or false");
  }

  const payments = await prisma.recurringPayment.findMany({
    where: {
      userId,
      ...(activeValue !== undefined && { isActive: activeValue === "true" }),
    },
    include,
    orderBy: [{ isActive: "desc" }, { nextDueDate: "asc" }],
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        payments.map(serialize),
        "Recurring payments fetched successfully",
      ),
    );
};

const fetchRecurringPaymentById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const payment = await findOwned(userId, requireId(req.params.id, "Id"));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        serialize(payment),
        "Recurring payment fetched successfully",
      ),
    );
};

const updateRecurringPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const existing = await findOwned(userId, requireId(req.params.id, "Id"));
  const body = req.body;

  const data: Prisma.RecurringPaymentUncheckedUpdateInput = {};

  if (body.name !== undefined) {
    data.name = requireString(body.name, "Name", 100);
  }
  if (body.amount !== undefined) {
    data.amount = parseAmount(body.amount);
  }
  if (body.accountId !== undefined) {
    const accountId = requireId(body.accountId, "Account id");
    if (accountId !== existing.accountId) {
      await assertUsableAccount(userId, accountId);
      data.accountId = accountId;
    }
  }
  if (body.categoryId !== undefined) {
    const categoryId = requireId(body.categoryId, "Category id");
    if (categoryId !== existing.categoryId) {
      await assertUsableCategory(userId, categoryId, existing.type);
      data.categoryId = categoryId;
    }
  }
  if (body.endDate !== undefined) {
    if (body.endDate === null) {
      data.endDate = null;
    } else {
      const endDate = parseDateOnly(body.endDate, "End date");
      if (endDate.getTime() < existing.nextDueDate.getTime()) {
        throw new ApiError(400, "End date cannot be before the next due date");
      }
      data.endDate = endDate;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const payment = await prisma.recurringPayment.update({
    where: { id: existing.id },
    data,
    include,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        serialize(payment),
        "Recurring payment updated successfully",
      ),
    );
};

const pauseRecurringPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const existing = await findOwned(userId, requireId(req.params.id, "Id"));
  if (!existing.isActive) {
    throw new ApiError(400, "Recurring payment is already paused or ended");
  }

  const payment = await prisma.recurringPayment.update({
    where: { id: existing.id },
    data: { isActive: false },
    include,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, serialize(payment), "Recurring payment paused"));
};

const resumeRecurringPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const existing = await findOwned(userId, requireId(req.params.id, "Id"));
  if (existing.isActive) {
    throw new ApiError(400, "Recurring payment is already active");
  }

  const today = todayIST();
  // Skip occurrences missed while paused: move to the first one on/after today.
  let nextDueDate = existing.nextDueDate;
  if (nextDueDate.getTime() < today.getTime()) {
    nextDueDate = nextOccurrenceAfter(
      existing.startDate,
      existing.frequency,
      new Date(today.getTime() - MS_PER_DAY),
    );
  }

  if (existing.endDate && nextDueDate.getTime() > existing.endDate.getTime()) {
    throw new ApiError(400, "Recurring payment has ended");
  }

  const payment = await prisma.recurringPayment.update({
    where: { id: existing.id },
    data: { isActive: true, nextDueDate },
    include,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, serialize(payment), "Recurring payment resumed"),
    );
};

const deleteRecurringPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const existing = await findOwned(userId, requireId(req.params.id, "Id"));

  await prisma.recurringPayment.delete({ where: { id: existing.id } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Recurring payment deleted"));
};

const fetchExecutions = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const existing = await findOwned(userId, requireId(req.params.id, "Id"));
  const { page, limit, skip } = parsePaging(req);

  const where = { recurringPaymentId: existing.id };
  const [total, rows] = await Promise.all([
    prisma.recurringExecution.count({ where }),
    prisma.recurringExecution.findMany({
      where,
      orderBy: { scheduledFor: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    scheduledFor: ymd(row.scheduledFor),
    status: row.status,
    transactionId: row.transactionId,
    reason: row.reason,
    executedAt: row.executedAt,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      "Executions fetched successfully",
    ),
  );
};

export {
  createRecurringPayment,
  fetchRecurringPayments,
  fetchRecurringPaymentById,
  updateRecurringPayment,
  pauseRecurringPayment,
  resumeRecurringPayment,
  deleteRecurringPayment,
  fetchExecutions,
};
