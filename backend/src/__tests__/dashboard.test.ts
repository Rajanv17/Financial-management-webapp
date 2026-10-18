import { describe, expect, it } from "vitest";
import { defaultCategories, registerAndLogin } from "./helpers";

describe("dashboard", () => {
  it("GET /dashboard/summary matches hand-computed totals for a fixed dataset", async () => {
    const { client } = await registerAndLogin();
    const { expense, income, categories } = await defaultCategories(client);
    const shopping = categories.find(
      (category) => category.name === "Shopping" && category.type === "expense",
    );
    if (!shopping) {
      throw new Error("Default Shopping category is required");
    }

    const createTx = async (payload: Record<string, unknown>) => {
      const res = await client.post("/api/v1/transactions").send(payload);
      expect(res.status).toBe(201);
    };

    await createTx({
      title: "January salary",
      amount: 1000,
      type: "income",
      categoryId: income.id,
      date: "2026-01-05T12:00:00.000Z",
    });
    await createTx({
      title: "January food",
      amount: 100,
      type: "expense",
      categoryId: expense.id,
      date: "2026-01-10T12:00:00.000Z",
    });
    await createTx({
      title: "January shopping",
      amount: 50,
      type: "expense",
      categoryId: shopping.id,
      date: "2026-01-20T12:00:00.000Z",
    });
    await createTx({
      title: "February food",
      amount: 200,
      type: "expense",
      categoryId: expense.id,
      date: "2026-02-08T12:00:00.000Z",
    });
    await createTx({
      title: "Outside range",
      amount: 9999,
      type: "expense",
      categoryId: expense.id,
      date: "2025-12-31T12:00:00.000Z",
    });

    const res = await client.get("/api/v1/dashboard/summary").query({
      from: "2026-01-01",
      to: "2026-02-28",
    });

    expect(res.status).toBe(200);

    const incomeTotal = 1000;
    const expenseTotal = 100 + 50 + 200;
    const foodTotal = 100 + 200;
    const shoppingTotal = 50;

    expect(res.body.data.totals).toEqual({
      income: incomeTotal,
      expense: expenseTotal,
      net: incomeTotal - expenseTotal,
    });

    expect(res.body.data.byCategory).toEqual([
      {
        categoryId: expense.id,
        name: expense.name,
        color: expect.any(String),
        total: foodTotal,
        percent: Math.round((foodTotal / expenseTotal) * 100),
      },
      {
        categoryId: shopping.id,
        name: shopping.name,
        color: expect.any(String),
        total: shoppingTotal,
        percent: Math.round((shoppingTotal / expenseTotal) * 100),
      },
    ]);

    expect(res.body.data.monthly).toEqual([
      { month: "2026-01", income: 1000, expense: 150 },
      { month: "2026-02", income: 0, expense: 200 },
    ]);
  });
});
