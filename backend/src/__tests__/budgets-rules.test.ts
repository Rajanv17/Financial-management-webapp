import { describe, expect, it } from "vitest";
import {
  defaultAccount,
  defaultCategories,
  registerAndLogin,
  type AuthedClient,
} from "./helpers";

type BudgetRow = {
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: string;
};

const setup = async () => {
  const user = await registerAndLogin();
  const { expense } = await defaultCategories(user.client);
  const account = await defaultAccount(user.client);
  return { ...user, expense, account };
};

const addExpense = async (
  client: AuthedClient,
  args: { categoryId: string; accountId: string; amount: number; date: string },
) => {
  const res = await client.post("/api/v1/transactions").send({
    title: "Test expense",
    type: "expense",
    ...args,
  });
  expect(res.status).toBe(201);
};

const addBudget = async (
  client: AuthedClient,
  categoryId: string,
  amount: number,
  month: number,
  year: number,
) => {
  const res = await client
    .post("/api/v1/budgets")
    .send({ categoryId, amount, month, year });
  expect(res.status).toBe(201);
};

const listBudgets = async (
  client: AuthedClient,
  month: number,
  year: number,
) => {
  const res = await client.get("/api/v1/budgets").query({ month, year });
  expect(res.status).toBe(200);
  return res.body.data as BudgetRow[];
};

describe("budgets: IST month boundaries", () => {
  it("counts 23:59:59 IST on Aug 31 in August only", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 1000, 8, 2026);
    await addBudget(client, expense.id, 1000, 9, 2026);
    await addExpense(client, {
      categoryId: expense.id,
      accountId: account.id,
      amount: 100,
      date: "2026-08-31T18:29:59.000Z",
    });

    expect((await listBudgets(client, 8, 2026))[0].spent).toBe(100);
    expect((await listBudgets(client, 9, 2026))[0].spent).toBe(0);
  });

  it("counts 00:00 IST on Sep 1 in September only", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 1000, 8, 2026);
    await addBudget(client, expense.id, 1000, 9, 2026);
    await addExpense(client, {
      categoryId: expense.id,
      accountId: account.id,
      amount: 100,
      date: "2026-08-31T18:30:00.000Z",
    });

    expect((await listBudgets(client, 8, 2026))[0].spent).toBe(0);
    expect((await listBudgets(client, 9, 2026))[0].spent).toBe(100);
  });
});

describe("budgets: user isolation", () => {
  it("ignores another user's expenses in the same default category", async () => {
    const a = await setup();
    const b = await setup();
    await addBudget(a.client, a.expense.id, 1000, 4, 2026);

    await addExpense(a.client, {
      categoryId: a.expense.id,
      accountId: a.account.id,
      amount: 100,
      date: "2026-04-10T12:00:00.000Z",
    });
    await addExpense(b.client, {
      categoryId: a.expense.id,
      accountId: b.account.id,
      amount: 900,
      date: "2026-04-10T12:00:00.000Z",
    });

    expect((await listBudgets(a.client, 4, 2026))[0].spent).toBe(100);
  });
});

describe("budgets: limit thresholds", () => {
  it("is near_limit when spent equals the limit, exceeded one rupee over", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 500, 3, 2026);
    await addExpense(client, {
      categoryId: expense.id,
      accountId: account.id,
      amount: 500,
      date: "2026-03-15T12:00:00.000Z",
    });

    const [atLimit] = await listBudgets(client, 3, 2026);
    expect(atLimit.status).toBe("near_limit");
    expect(atLimit.remaining).toBe(0);
    expect(atLimit.percentageUsed).toBe(100);

    await addExpense(client, {
      categoryId: expense.id,
      accountId: account.id,
      amount: 1,
      date: "2026-03-16T12:00:00.000Z",
    });

    const [over] = await listBudgets(client, 3, 2026);
    expect(over.status).toBe("exceeded");
    expect(over.remaining).toBe(-1);
  });
});
