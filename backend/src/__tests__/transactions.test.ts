import { describe, expect, it } from "vitest";
import {
  createAccount,
  defaultAccount,
  defaultCategories,
  registerAndLogin,
} from "./helpers";

describe("transactions", () => {
  it("rejects a missing accountId with 400", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);

    const res = await client.post("/api/v1/transactions").send({
      title: "No account",
      amount: 40,
      type: "expense",
      categoryId: expense.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("accountId is invalid");
  });

  it("rejects another user's accountId with 400", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();
    const accountA = await defaultAccount(userA.client);
    const { expense } = await defaultCategories(userB.client);

    const res = await userB.client.post("/api/v1/transactions").send({
      title: "Wrong owner",
      amount: 40,
      type: "expense",
      categoryId: expense.id,
      accountId: accountA.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or archived account");
  });

  it("rejects creating a transaction on an archived account with 400", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const account = await createAccount(client, { name: "Old card" });

    const archived = await client.patch(`/api/v1/accounts/archive/${account.id}`);
    expect(archived.status).toBe(200);

    const res = await client.post("/api/v1/transactions").send({
      title: "Should fail",
      amount: 40,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or archived account");
  });

  it("can update a transaction that already sits on an archived account", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const account = await createAccount(client, { name: "Soon archived" });

    const created = await client.post("/api/v1/transactions").send({
      title: "Existing",
      amount: 25,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
    });
    expect(created.status).toBe(201);

    const archived = await client.patch(`/api/v1/accounts/archive/${account.id}`);
    expect(archived.status).toBe(200);

    const updated = await client
      .patch(`/api/v1/transactions/${created.body.data.id}`)
      .send({ title: "Still allowed" });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Still allowed");
    expect(updated.body.data.accountId).toBe(account.id);
  });

  it("filters by accountId and includes an account object on each row", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const unassigned = await defaultAccount(client);
    const checking = await createAccount(client, { name: "Checking" });

    const onUnassigned = await client.post("/api/v1/transactions").send({
      title: "Cash spend",
      amount: 10,
      type: "expense",
      categoryId: expense.id,
      accountId: unassigned.id,
    });
    expect(onUnassigned.status).toBe(201);

    const onChecking = await client.post("/api/v1/transactions").send({
      title: "Card spend",
      amount: 20,
      type: "expense",
      categoryId: expense.id,
      accountId: checking.id,
    });
    expect(onChecking.status).toBe(201);

    const res = await client.get("/api/v1/transactions").query({
      accountId: checking.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].id).toBe(onChecking.body.data.id);
    expect(res.body.data.items[0].account).toMatchObject({
      id: checking.id,
      name: "Checking",
      type: "bank",
    });
  });

  it("rejects a type/category mismatch with 400", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const account = await defaultAccount(client);

    const res = await client.post("/api/v1/transactions").send({
      title: "Salary as expense category",
      amount: 500,
      type: "income",
      categoryId: expense.id,
      accountId: account.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Transaction type must match the category type",
    );
  });

  it("rejects an archived category with 400", async () => {
    const { client } = await registerAndLogin();
    const account = await defaultAccount(client);

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
      accountId: account.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or archived category");
  });

  it("paginates and filters by type", async () => {
    const { client } = await registerAndLogin();
    const { expense, income } = await defaultCategories(client);
    const account = await defaultAccount(client);

    const payloads = [
      {
        title: "Expense one",
        amount: 10,
        type: "expense",
        categoryId: expense.id,
        accountId: account.id,
        date: "2026-04-01T12:00:00.000Z",
      },
      {
        title: "Expense two",
        amount: 20,
        type: "expense",
        categoryId: expense.id,
        accountId: account.id,
        date: "2026-04-02T12:00:00.000Z",
      },
      {
        title: "Salary",
        amount: 1000,
        type: "income",
        categoryId: income.id,
        accountId: account.id,
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
