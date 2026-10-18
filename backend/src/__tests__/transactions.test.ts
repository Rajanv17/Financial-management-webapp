import { describe, expect, it } from "vitest";
import { defaultCategories, registerAndLogin } from "./helpers";

describe("transactions", () => {
  it("rejects a type/category mismatch with 400", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);

    const res = await client.post("/api/v1/transactions").send({
      title: "Salary as expense category",
      amount: 500,
      type: "income",
      categoryId: expense.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Transaction type must match the category type",
    );
  });

  it("rejects an archived category with 400", async () => {
    const { client } = await registerAndLogin();

    const createdCategory = await client.post("/api/v1/categories").send({
      name: "Old hobby",
      type: "expense",
    });
    expect(createdCategory.status).toBe(201);
    const categoryId = createdCategory.body.data.id as string;

    const archived = await client.patch(`/api/v1/categories/archive/${categoryId}`);
    expect(archived.status).toBe(200);

    const res = await client.post("/api/v1/transactions").send({
      title: "Should fail",
      amount: 40,
      type: "expense",
      categoryId,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or archived category");
  });

  it("paginates and filters by type", async () => {
    const { client } = await registerAndLogin();
    const { expense, income } = await defaultCategories(client);

    const payloads = [
      {
        title: "Expense one",
        amount: 10,
        type: "expense",
        categoryId: expense.id,
        date: "2026-04-01T12:00:00.000Z",
      },
      {
        title: "Expense two",
        amount: 20,
        type: "expense",
        categoryId: expense.id,
        date: "2026-04-02T12:00:00.000Z",
      },
      {
        title: "Salary",
        amount: 1000,
        type: "income",
        categoryId: income.id,
        date: "2026-04-03T12:00:00.000Z",
      },
    ];

    for (const payload of payloads) {
      const created = await client.post("/api/v1/transactions").send(payload);
      expect(created.status).toBe(201);
    }

    const page1 = await client.get("/api/v1/transactions").query({
      page: 1,
      limit: 2,
      sortBy: "date",
      sortOrder: "asc",
    });
    expect(page1.status).toBe(200);
    expect(page1.body.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
    expect(page1.body.data.items).toHaveLength(2);
    expect(page1.body.data.items.map((row: { title: string }) => row.title)).toEqual([
      "Expense one",
      "Expense two",
    ]);

    const page2 = await client.get("/api/v1/transactions").query({
      page: 2,
      limit: 2,
      sortBy: "date",
      sortOrder: "asc",
    });
    expect(page2.status).toBe(200);
    expect(page2.body.data.items).toHaveLength(1);
    expect(page2.body.data.items[0].title).toBe("Salary");

    const incomeOnly = await client.get("/api/v1/transactions").query({
      type: "income",
    });
    expect(incomeOnly.status).toBe(200);
    expect(incomeOnly.body.data.pagination.total).toBe(1);
    expect(incomeOnly.body.data.items).toHaveLength(1);
    expect(incomeOnly.body.data.items[0].type).toBe("income");
  });
});
