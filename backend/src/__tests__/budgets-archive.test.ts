import { describe, expect, it } from "vitest";
import {
  defaultCategories,
  registerAndLogin,
  type AuthedClient,
} from "./helpers";

const addBudget = async (
  client: AuthedClient,
  categoryId: string,
  amount = 1000,
) => {
  const res = await client
    .post("/api/v1/budgets")
    .send({ categoryId, amount, month: 4, year: 2026 });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
};

const listIds = async (client: AuthedClient, archived?: boolean) => {
  const res = await client
    .get("/api/v1/budgets")
    .query({ month: 4, year: 2026, ...(archived ? { archived: "true" } : {}) });
  expect(res.status).toBe(200);
  return (res.body.data as { id: string }[]).map((row) => row.id);
};

describe("budgets: archive and restore", () => {
  it("lists archived budgets separately and restores them", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const budget = await addBudget(client, expense.id);

    const archive = await client.delete(`/api/v1/budgets/${budget.id}`);
    expect(archive.status).toBe(200);
    expect(await listIds(client)).toEqual([]);
    expect(await listIds(client, true)).toEqual([budget.id]);

    const restore = await client.patch(`/api/v1/budgets/${budget.id}/restore`);
    expect(restore.status).toBe(200);
    expect(await listIds(client)).toEqual([budget.id]);
    expect(await listIds(client, true)).toEqual([]);
  });

  it("refuses to restore when an active budget exists for the same category and month", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);
    const first = await addBudget(client, expense.id, 1000);
    await client.delete(`/api/v1/budgets/${first.id}`);
    await addBudget(client, expense.id, 2000);

    const restore = await client.patch(`/api/v1/budgets/${first.id}/restore`);
    expect(restore.status).toBe(400);
    expect(await listIds(client, true)).toEqual([first.id]);
  });

  it("refuses to restore when the category is archived", async () => {
    const { client } = await registerAndLogin();
    const created = await client
      .post("/api/v1/categories")
      .send({ name: "Temporary", type: "expense" });
    expect(created.status).toBe(201);
    const categoryId = created.body.data.id as string;

    const budget = await addBudget(client, categoryId);
    await client.delete(`/api/v1/budgets/${budget.id}`);
    const archived = await client.patch(
      `/api/v1/categories/archive/${categoryId}`,
    );
    expect(archived.status).toBe(200);

    const restore = await client.patch(`/api/v1/budgets/${budget.id}/restore`);
    expect(restore.status).toBe(400);
  });

  it("returns 404 for another user's budget and for a budget that is not archived", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const { expense } = await defaultCategories(owner.client);
    const budget = await addBudget(owner.client, expense.id);

    const notArchived = await owner.client.patch(
      `/api/v1/budgets/${budget.id}/restore`,
    );
    expect(notArchived.status).toBe(404);

    await owner.client.delete(`/api/v1/budgets/${budget.id}`);
    const foreign = await intruder.client.patch(
      `/api/v1/budgets/${budget.id}/restore`,
    );
    expect(foreign.status).toBe(404);
  });

  it("rejects an invalid archived flag", async () => {
    const { client } = await registerAndLogin();
    const res = await client
      .get("/api/v1/budgets")
      .query({ month: 4, year: 2026, archived: "maybe" });
    expect(res.status).toBe(400);
  });
});
