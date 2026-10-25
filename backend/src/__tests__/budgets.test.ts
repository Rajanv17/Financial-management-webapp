import { describe, expect, it } from "vitest";
import { defaultAccount, defaultCategories, registerAndLogin } from "./helpers";

describe("budgets", () => {
  it("spent equals the sum of expense transactions in that month", async () => {
    const { client } = await registerAndLogin();
    const { expense, income, categories } = await defaultCategories(client);
    const account = await defaultAccount(client);
    const otherExpense = categories.find(
      (category) => category.type === "expense" && category.id !== expense.id,
    );
    if (!otherExpense) {
      throw new Error("Need a second default expense category");
    }

    const createTx = async (payload: Record<string, unknown>) => {
      const res = await client.post("/api/v1/transactions").send(payload);
      expect(res.status).toBe(201);
    };

    await createTx({
      title: "In-month expense",
      amount: 150.5,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
      date: "2026-05-10T12:00:00.000Z",
    });
    await createTx({
      title: "Second in-month expense",
      amount: 49.5,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
      date: "2026-05-20T12:00:00.000Z",
    });
    await createTx({
      title: "Other category same month",
      amount: 80,
      type: "expense",
      categoryId: otherExpense.id,
      accountId: account.id,
      date: "2026-05-12T12:00:00.000Z",
    });
    await createTx({
      title: "Next month expense",
      amount: 999,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
      date: "2026-06-01T00:00:00.000Z",
    });
    await createTx({
      title: "Income same month",
      amount: 2000,
      type: "income",
      categoryId: income.id,
      accountId: account.id,
      date: "2026-05-15T12:00:00.000Z",
    });

    const created = await client.post("/api/v1/budgets").send({
      categoryId: expense.id,
      amount: 500,
      month: 5,
      year: 2026,
    });
    expect(created.status).toBe(201);

    const list = await client.get("/api/v1/budgets").query({ month: 5, year: 2026 });
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].spent).toBe(200);
  });

  it("rejects a duplicate budget", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const payload = {
      categoryId: expense.id,
      amount: 300,
      month: 7,
      year: 2026,
    };

    const first = await client.post("/api/v1/budgets").send(payload);
    expect(first.status).toBe(201);

    const second = await client.post("/api/v1/budgets").send(payload);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe(
      "Budget already exists for this category and month",
    );
  });
});
