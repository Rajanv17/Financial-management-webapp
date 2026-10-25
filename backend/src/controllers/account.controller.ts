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
import { AccountType, TransactionType } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";

const ACCOUNT_TYPES = Object.values(AccountType);
const DUPLICATE_MESSAGE =
  "An account with the same name already exists (it may be archived)";
const DEFAULT_LOCKED_MESSAGE = "The default account cannot be modified";

type AccountRow = Awaited<
  ReturnType<typeof prisma.financialAccount.findMany>
>[number];

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

// Money input: up to 10 integer digits, up to 2 decimals, negatives allowed
// (a credit card can start with an amount owed).
const parseMoney = (value: unknown, label: string): string => {
  const text = String(value ?? "").trim();
  if (!/^-?\d{1,10}(\.\d{1,2})?$/.test(text)) {
    throw new ApiError(
      400,
      `${label} must be a number with at most 2 decimal places`,
    );
  }
  return text;
};

// balance = openingBalance + SUM(income) - SUM(expense), one query for all accounts.
const withBalances = async (userId: string, accounts: AccountRow[]) => {
  if (accounts.length === 0) return [];

  const sums = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, accountId: { in: accounts.map((a) => a.id) } },
    _sum: { amount: true },
  });

  return accounts.map((account) => {
    let balance = account.openingBalance;
    for (const row of sums) {
      if (row.accountId !== account.id || !row._sum.amount) continue;
      balance =
        row.type === TransactionType.income
          ? balance.plus(row._sum.amount)
          : balance.minus(row._sum.amount);
    }
    return { ...account, balance: balance.toFixed(2) };
  });
};

const findOwnedAccount = async (
  userId: string,
  id: string,
  extraWhere: { isArchived?: boolean } = {},
) =>
  prisma.financialAccount.findFirst({
    where: { id, userId, ...extraWhere },
  });

const createAccount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body;

  const name = requireString(body.name, "Name", 50);
  const type = parseEnum(body.type, ACCOUNT_TYPES, "Type");
  const institutionName = optionalString(
    body.institutionName,
    "Institution name",
    100,
  );
  const icon = optionalString(body.icon, "Icon", 50);
  const color = optionalString(body.color, "Color", 9);
  const openingBalance =
    body.openingBalance !== undefined
      ? parseMoney(body.openingBalance, "Opening balance")
      : "0";

  try {
    const account = await prisma.financialAccount.create({
      data: {
        userId,
        name,
        type,
        openingBalance,
        institutionName,
        icon,
        color,
        isDefault: false,
      },
    });
    const [withBalance] = await withBalances(userId, [account]);

    return res
      .status(201)
      .json(new ApiResponse(201, withBalance, "Account created successfully"));
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(400, DUPLICATE_MESSAGE);
    }
    throw error;
  }
};

const fetchAccounts = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const archivedValue = optionalQueryString(req.query.archived, "archived");

  if (
    archivedValue !== undefined &&
    archivedValue !== "true" &&
    archivedValue !== "false"
  ) {
    throw new ApiError(400, "archived must be true or false");
  }

  const accounts = await prisma.financialAccount.findMany({
    where: { userId, isArchived: archivedValue === "true" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        await withBalances(userId, accounts),
        "Accounts fetched successfully",
      ),
    );
};

const fetchAccountSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);

  const accounts = await prisma.financialAccount.findMany({
    where: { userId, isArchived: false },
  });
  const rows = await withBalances(userId, accounts);

  const byType: Record<string, Prisma.Decimal> = {};
  let net = new Prisma.Decimal(0);
  for (const row of rows) {
    const amount = new Prisma.Decimal(row.balance);
    byType[row.type] = (byType[row.type] ?? new Prisma.Decimal(0)).plus(amount);
    net = net.plus(amount);
  }

  const summary = {
    netBalance: net.toFixed(2),
    byType: Object.entries(byType).map(([type, total]) => ({
      type,
      total: total.toFixed(2),
    })),
    accountCount: rows.length,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, summary, "Account summary fetched successfully"),
    );
};

const fetchAccountById = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const accountId = requireId(req.params.id, "Account id");

  const account = await findOwnedAccount(userId, accountId);
  if (!account) {
    throw new ApiError(404, "Account not found");
  }
  const [withBalance] = await withBalances(userId, [account]);

  return res
    .status(200)
    .json(new ApiResponse(200, withBalance, "Account fetched successfully"));
};

const updateAccount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const accountId = requireId(req.params.id, "Account id");
  const body = req.body;

  const existing = await findOwnedAccount(userId, accountId);
  if (!existing) {
    throw new ApiError(404, "Account not found");
  }
  if (existing.isDefault) {
    throw new ApiError(400, DEFAULT_LOCKED_MESSAGE);
  }

  const data = {
    ...(body.name !== undefined && {
      name: requireString(body.name, "Name", 50),
    }),
    ...(body.type !== undefined && {
      type: parseEnum(body.type, ACCOUNT_TYPES, "Type"),
    }),
    ...(body.institutionName !== undefined && {
      institutionName: optionalString(
        body.institutionName,
        "Institution name",
        100,
      ),
    }),
    ...(body.icon !== undefined && {
      icon: optionalString(body.icon, "Icon", 50),
    }),
    ...(body.color !== undefined && {
      color: optionalString(body.color, "Color", 9),
    }),
    ...(body.openingBalance !== undefined && {
      openingBalance: parseMoney(body.openingBalance, "Opening balance"),
    }),
  };

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  try {
    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data,
    });
    const [withBalance] = await withBalances(userId, [account]);

    return res
      .status(200)
      .json(new ApiResponse(200, withBalance, "Account updated successfully"));
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(400, DUPLICATE_MESSAGE);
    }
    throw error;
  }
};

const archiveAccount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const accountId = requireId(req.params.id, "Account id");

  const existing = await findOwnedAccount(userId, accountId, {
    isArchived: false,
  });
  if (!existing) {
    throw new ApiError(404, "Account not found");
  }
  if (existing.isDefault) {
    throw new ApiError(400, DEFAULT_LOCKED_MESSAGE);
  }

  const account = await prisma.financialAccount.update({
    where: { id: accountId },
    data: { isArchived: true, archivedAt: new Date() },
  });
  const [withBalance] = await withBalances(userId, [account]);

  return res
    .status(200)
    .json(new ApiResponse(200, withBalance, "Account archived successfully"));
};

const restoreAccount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const accountId = requireId(req.params.id, "Account id");

  const existing = await findOwnedAccount(userId, accountId, {
    isArchived: true,
  });
  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  const account = await prisma.financialAccount.update({
    where: { id: accountId },
    data: { isArchived: false, archivedAt: null },
  });
  const [withBalance] = await withBalances(userId, [account]);

  return res
    .status(200)
    .json(new ApiResponse(200, withBalance, "Account restored successfully"));
};

export {
  createAccount,
  fetchAccounts,
  fetchAccountSummary,
  fetchAccountById,
  updateAccount,
  archiveAccount,
  restoreAccount,
};
