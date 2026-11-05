import { describe, expect, it } from "vitest";
import { prisma } from "../config";
import { checkBudgetThresholds } from "../services";
import { defaultAccount, defaultCategories, registerAndLogin } from "./helpers";

async function setup(limit: number, budgetOverrides = {}) {
  const { client } = await registerAndLogin();
  const { expense } = await defaultCategories(client);
  const account = await defaultAccount(client);
  const row = await prisma.financialAccount.findUniqueOrThrow({
    where: { id: account.id },
  });
  const budget = await prisma.budget.create({
    data: {
      userId: row.userId,
      categoryId: expense.id,
      amount: limit,
      month: 11,
      year: 2026,
      ...budgetOverrides,
    },
  });
  const ctx = {
    userId: row.userId,
    categoryId: expense.id,
    month: 11,
    year: 2026,
  };
  const spend = (amount: number, type: "expense" | "income" = "expense") =>
    prisma.transaction.create({
      data: {
        userId: row.userId,
        categoryId: expense.id,
        accountId: account.id,
        title: "t",
        amount,
        type,
        date: new Date("2026-11-10T06:30:00.000Z"), // 12:00 IST
      },
    });
  const notes = () =>
    prisma.notification.findMany({ where: { userId: row.userId } });
  return { ctx, budget, spend, notes };
}

describe("checkBudgetThresholds", () => {
  it("does nothing below 80%", async () => {
    const { ctx, spend, notes } = await setup(1000);
    await spend(790);
    await checkBudgetThresholds(ctx);
    expect(await notes()).toHaveLength(0);
  });

  it("creates one near-limit notification at 80%, even if checked twice", async () => {
    const { ctx, budget, spend, notes } = await setup(1000);
    await spend(800);
    await checkBudgetThresholds(ctx);
    await checkBudgetThresholds(ctx);

    const all = await notes();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("budget_near_limit");
    expect(all[0].dedupeKey).toBe(`budget:${budget.id}:near_limit`);
  });

  it("is still near-limit (not exceeded) when spent equals the limit", async () => {
    const { ctx, spend, notes } = await setup(1000);
    await spend(1000);
    await checkBudgetThresholds(ctx);
    expect((await notes()).map((n) => n.type)).toEqual(["budget_near_limit"]);
  });

  it("creates an exceeded notification when spent > limit", async () => {
    const { ctx, spend, notes } = await setup(1000);
    await spend(1001);
    await checkBudgetThresholds(ctx);
    const all = await notes();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("budget_exceeded");
  });

  it("sends both alerts when a budget crosses 80% first, then 100%", async () => {
    const { ctx, spend, notes } = await setup(1000);
    await spend(850);
    await checkBudgetThresholds(ctx);
    await spend(200);
    await checkBudgetThresholds(ctx);
    expect((await notes()).map((n) => n.type).sort()).toEqual([
      "budget_exceeded",
      "budget_near_limit",
    ]);
  });

  it("ignores income, inactive budgets and archived budgets", async () => {
    const a = await setup(1000);
    await a.spend(5000, "income");
    await checkBudgetThresholds(a.ctx);
    expect(await a.notes()).toHaveLength(0);

    const b = await setup(1000, { isActive: false });
    await b.spend(900);
    expect(await checkBudgetThresholds(b.ctx)).toBeNull();
    expect(await b.notes()).toHaveLength(0);

    const c = await setup(1000, { isArchived: true });
    await c.spend(900);
    expect(await checkBudgetThresholds(c.ctx)).toBeNull();
  });
});
