import { describe, expect, it } from "vitest";
import {
  defaultCategories,
  registerAndLogin,
  type AuthedClient,
} from "./helpers";

const createBudget = async (
  client: AuthedClient,
  categoryId: string,
  amount: number,
  month = 2,
  year = 2026,
) => {
  const res = await client
    .post("/api/v1/budgets")
    .send({ categoryId, amount, month, year });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
};

describe("budgets: paused budgets", () => {
  it("shows a paused budget in the list but leaves it out of the summary", async () => {
    const { client } = await registerAndLogin();
    const { categories } = await defaultCategories(client);
    const [first, second] = categories.filter(
      (c) => c.type === "expense" && c.isDefault,
    );
    if (!first || !second)
      throw new Error("Need two default expense categories");

    await createBudget(client, first.id, 1000);
    const paused = await createBudget(client, second.id, 500);

    const pause = await client
      .patch(`/api/v1/budgets/${paused.id}`)
      .send({ isActive: false });
    expect(pause.status).toBe(200);

    const list = await client
      .get("/api/v1/budgets")
      .query({ month: 2, year: 2026 });
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);

    const summary = await client
      .get("/api/v1/budgets/summary")
      .query({ month: 2, year: 2026 });
    expect(summary.status).toBe(200);
    expect(summary.body.data.totalBudget).toBe(1000);
  });
});

describe("budgets: ownership", () => {
  it("returns 404 when another user updates or archives a budget", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const { expense } = await defaultCategories(owner.client);
    const budget = await createBudget(owner.client, expense.id, 800);

    const update = await intruder.client
      .patch(`/api/v1/budgets/${budget.id}`)
      .send({ amount: 1 });
    expect(update.status).toBe(404);

    const archive = await intruder.client.delete(
      `/api/v1/budgets/${budget.id}`,
    );
    expect(archive.status).toBe(404);

    const list = await owner.client
      .get("/api/v1/budgets")
      .query({ month: 2, year: 2026 });
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].amount).toBe(800);
  });
});

describe("budgets: archived categories", () => {
  it("rejects a new budget on an archived category", async () => {
    const { client } = await registerAndLogin();

    const created = await client
      .post("/api/v1/categories")
      .send({ name: "Temporary", type: "expense" });
    expect(created.status).toBe(201);
    const categoryId = created.body.data.id as string;

    const archived = await client.patch(
      `/api/v1/categories/archive/${categoryId}`,
    );
    expect(archived.status).toBe(200);

    const res = await client
      .post("/api/v1/budgets")
      .send({ categoryId, amount: 300, month: 2, year: 2026 });
    expect(res.status).toBe(404);
  });
});
