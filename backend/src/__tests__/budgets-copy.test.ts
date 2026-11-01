import { describe, expect, it } from "vitest";
import {
  defaultCategories,
  registerAndLogin,
  type AuthedClient,
} from "./helpers";

type BudgetRow = {
  categoryId: string;
  amount: number;
  isActive: boolean;
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
  return res.body.data as { id: string };
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

const twoExpenseCategories = async (client: AuthedClient) => {
  const { categories } = await defaultCategories(client);
  const [first, second] = categories.filter(
    (c) => c.type === "expense" && c.isDefault,
  );
  if (!first || !second) throw new Error("Need two default expense categories");
  return { first, second };
};

describe("budgets: copy previous month", () => {
  it("copies amounts and keeps the paused state", async () => {
    const { client } = await registerAndLogin();
    const { first, second } = await twoExpenseCategories(client);
    await addBudget(client, first.id, 1000, 5, 2026);
    const paused = await addBudget(client, second.id, 500, 5, 2026);
    const pause = await client
      .patch(`/api/v1/budgets/${paused.id}`)
      .send({ isActive: false });
    expect(pause.status).toBe(200);

    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(2);
    expect(res.body.data.skipped).toBe(0);

    const rows = await listBudgets(client, 6, 2026);
    expect(rows).toHaveLength(2);
    const copiedFirst = rows.find((r) => r.categoryId === first.id);
    const copiedSecond = rows.find((r) => r.categoryId === second.id);
    expect(copiedFirst?.amount).toBe(1000);
    expect(copiedFirst?.isActive).toBe(true);
    expect(copiedSecond?.amount).toBe(500);
    expect(copiedSecond?.isActive).toBe(false);
  });

  it("skips categories that already have a budget and is safe to repeat", async () => {
    const { client } = await registerAndLogin();
    const { first, second } = await twoExpenseCategories(client);
    await addBudget(client, first.id, 1000, 5, 2026);
    await addBudget(client, second.id, 500, 5, 2026);
    await addBudget(client, first.id, 777, 6, 2026);

    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(1);
    expect(res.body.data.skipped).toBe(1);

    const again = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(again.status).toBe(200);
    expect(again.body.data.created).toBe(0);

    const rows = await listBudgets(client, 6, 2026);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.categoryId === first.id)?.amount).toBe(777);
  });

  it("skips budgets whose category has since been archived", async () => {
    const { client } = await registerAndLogin();
    const { first } = await twoExpenseCategories(client);

    const created = await client
      .post("/api/v1/categories")
      .send({ name: "Temporary", type: "expense" });
    expect(created.status).toBe(201);
    const tempId = created.body.data.id as string;

    await addBudget(client, first.id, 1000, 5, 2026);
    await addBudget(client, tempId, 300, 5, 2026);

    const archived = await client.patch(`/api/v1/categories/archive/${tempId}`);
    expect(archived.status).toBe(200);

    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(1);
    expect(res.body.data.skipped).toBe(1);

    const rows = await listBudgets(client, 6, 2026);
    expect(rows).toHaveLength(1);
    expect(rows[0].categoryId).toBe(first.id);
  });

  it("copies January from December of the previous year", async () => {
    const { client } = await registerAndLogin();
    const { first } = await twoExpenseCategories(client);
    await addBudget(client, first.id, 1200, 12, 2026);

    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 1, year: 2027 });
    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(1);
    expect((await listBudgets(client, 1, 2027))[0].amount).toBe(1200);
  });

  it("never copies another user's budgets", async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    const { first } = await twoExpenseCategories(a.client);
    await addBudget(a.client, first.id, 1000, 5, 2026);

    const res = await b.client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(0);
    expect(await listBudgets(b.client, 6, 2026)).toHaveLength(0);
  });

  it("returns 200 with nothing created when the previous month is empty", async () => {
    const { client } = await registerAndLogin();
    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 6, year: 2026 });
    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(0);
    expect(res.body.data.skipped).toBe(0);
  });

  it("rejects an invalid month", async () => {
    const { client } = await registerAndLogin();
    const res = await client
      .post("/api/v1/budgets/copy")
      .send({ month: 13, year: 2026 });
    expect(res.status).toBe(400);
  });
});
