import { describe, expect, it } from "vitest";
import {
  defaultAccount,
  defaultCategories,
  registerAndLogin,
  type AuthedClient,
} from "./helpers";

const setup = async () => {
  const user = await registerAndLogin();
  const { expense, categories } = await defaultCategories(user.client);
  const account = await defaultAccount(user.client);
  return { ...user, expense, categories, account };
};

const addExpense = async (
  client: AuthedClient,
  categoryId: string,
  accountId: string,
  amount: number,
  date: string,
) => {
  const res = await client.post("/api/v1/transactions").send({
    title: "Test expense",
    type: "expense",
    categoryId,
    accountId,
    amount,
    date,
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

const fetchBoth = async (client: AuthedClient, month: number, year: number) => {
  const list = await client.get("/api/v1/budgets").query({ month, year });
  const summary = await client
    .get("/api/v1/budgets/summary")
    .query({ month, year });
  expect(list.status).toBe(200);
  expect(summary.status).toBe(200);
  return { row: list.body.data[0], summary: summary.body.data };
};

describe("budgets: month-over-month comparison", () => {
  it("reports previous spend, delta and percent", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 1000, 6, 2026);
    await addExpense(
      client,
      expense.id,
      account.id,
      300,
      "2026-05-10T12:00:00.000Z",
    );
    await addExpense(
      client,
      expense.id,
      account.id,
      450,
      "2026-06-10T12:00:00.000Z",
    );

    const { row, summary } = await fetchBoth(client, 6, 2026);

    expect(row.spent).toBe(450);
    expect(row.previousSpent).toBe(300);
    expect(summary.totalSpent).toBe(450);
    expect(summary.previousTotalSpent).toBe(300);
    expect(summary.spentDelta).toBe(150);
    expect(summary.spentDeltaPercent).toBe(50);
  });

  it("compares January with December of the previous year", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 1000, 1, 2027);
    await addExpense(
      client,
      expense.id,
      account.id,
      200,
      "2026-12-15T12:00:00.000Z",
    );
    await addExpense(
      client,
      expense.id,
      account.id,
      100,
      "2027-01-15T12:00:00.000Z",
    );

    const { row, summary } = await fetchBoth(client, 1, 2027);

    expect(row.previousSpent).toBe(200);
    expect(summary.spentDelta).toBe(-100);
    expect(summary.spentDeltaPercent).toBe(-50);
  });

  it("returns a null percent when there was no previous spend", async () => {
    const { client, expense, account } = await setup();
    await addBudget(client, expense.id, 1000, 6, 2026);
    await addExpense(
      client,
      expense.id,
      account.id,
      80,
      "2026-06-10T12:00:00.000Z",
    );

    const { row, summary } = await fetchBoth(client, 6, 2026);

    expect(row.previousSpent).toBe(0);
    expect(summary.previousTotalSpent).toBe(0);
    expect(summary.spentDelta).toBe(80);
    expect(summary.spentDeltaPercent).toBeNull();
  });

  it("ignores previous-month spend in categories without a budget", async () => {
    const { client, expense, categories, account } = await setup();
    const other = categories.find(
      (c) => c.type === "expense" && c.id !== expense.id,
    );
    if (!other) throw new Error("Need a second default expense category");

    await addBudget(client, expense.id, 1000, 6, 2026);
    await addExpense(
      client,
      other.id,
      account.id,
      999,
      "2026-05-10T12:00:00.000Z",
    );

    const { summary } = await fetchBoth(client, 6, 2026);

    expect(summary.previousTotalSpent).toBe(0);
  });
});
