import { describe, expect, it } from "vitest";
import { defaultCategories, registerAndLogin } from "./helpers";

describe("budgets: monthly-only periods", () => {
  it("rejects a non-monthly period", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);

    const res = await client.post("/api/v1/budgets").send({
      categoryId: expense.id,
      amount: 5000,
      month: 1,
      year: 2030,
      period: "weekly",
    });

    expect(res.status).toBe(400);
  });

  it("accepts an explicit monthly period", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);

    const res = await client.post("/api/v1/budgets").send({
      categoryId: expense.id,
      amount: 5000,
      month: 1,
      year: 2030,
      period: "monthly",
    });

    expect(res.status).toBe(201);
  });
});
