import { describe, expect, it } from "vitest";
import { prisma } from "../config";
import { todayIST } from "../utils/recurrence.util";
import { defaultAccount, defaultCategories, registerAndLogin } from "./helpers";

const BASE = "/api/v1/recurring-payments";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const tomorrow = () => iso(new Date(todayIST().getTime() + 86_400_000));
const yesterday = () => iso(new Date(todayIST().getTime() - 86_400_000));

async function setup() {
  const { client } = await registerAndLogin();
  const { expense, income } = await defaultCategories(client);
  const account = await defaultAccount(client);
  const payload = {
    name: "Rent",
    type: "expense",
    amount: 499.5,
    frequency: "monthly",
    startDate: tomorrow(),
    accountId: account.id,
    categoryId: expense.id,
  };
  return { client, expense, income, account, payload };
}

describe("recurring payments API", () => {
  it("creates a payment with nextDueDate equal to startDate", async () => {
    const { client, payload } = await setup();

    const res = await client.post(BASE).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "Rent",
      amount: 499.5,
      startDate: payload.startDate,
      nextDueDate: payload.startDate,
      isActive: true,
    });
  });

  it("rejects a start date in the past", async () => {
    const { client, payload } = await setup();

    const res = await client
      .post(BASE)
      .send({ ...payload, startDate: yesterday() });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Start date cannot be in the past");
  });

  it("rejects a type/category mismatch", async () => {
    const { client, payload, income } = await setup();

    const res = await client
      .post(BASE)
      .send({ ...payload, categoryId: income.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Payment type must match the category type");
  });

  it("rejects another user's account", async () => {
    const { client, payload } = await setup();
    const other = await registerAndLogin();
    const otherAccount = await defaultAccount(other.client);

    const res = await client
      .post(BASE)
      .send({ ...payload, accountId: otherAccount.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or archived account");
  });

  it("returns 404 for another user's payment", async () => {
    const { client, payload } = await setup();
    const created = await client.post(BASE).send(payload);
    const other = await registerAndLogin();

    const res = await other.client.get(`${BASE}/${created.body.data.id}`);

    expect(res.status).toBe(404);
  });

  it("pauses, then resumes by skipping occurrences missed while paused", async () => {
    const { client, payload } = await setup();
    const created = await client.post(BASE).send(payload);
    const id = created.body.data.id as string;

    const paused = await client.patch(`${BASE}/${id}/pause`);
    expect(paused.status).toBe(200);
    expect(paused.body.data.isActive).toBe(false);

    // Simulate a long pause: the payment fell months behind.
    await prisma.recurringPayment.update({
      where: { id },
      data: {
        startDate: new Date("2026-01-15T00:00:00.000Z"),
        nextDueDate: new Date("2026-01-15T00:00:00.000Z"),
      },
    });

    const resumed = await client.patch(`${BASE}/${id}/resume`);
    expect(resumed.status).toBe(200);
    expect(resumed.body.data.isActive).toBe(true);
    expect(resumed.body.data.nextDueDate >= iso(todayIST())).toBe(true);
    expect(resumed.body.data.nextDueDate.endsWith("-15")).toBe(true);
    expect(await prisma.transaction.count({ where: { title: "Rent" } })).toBe(
      0,
    );
  });

  it("lists executions with pagination", async () => {
    const { client, payload } = await setup();
    const created = await client.post(BASE).send(payload);

    const res = await client.get(`${BASE}/${created.body.data.id}/executions`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination).toMatchObject({ page: 1, total: 0 });
  });

  it("deletes a payment", async () => {
    const { client, payload } = await setup();
    const created = await client.post(BASE).send(payload);
    const id = created.body.data.id as string;

    const del = await client.delete(`${BASE}/${id}`);
    expect(del.status).toBe(200);

    const after = await client.get(`${BASE}/${id}`);
    expect(after.status).toBe(404);
  });
});
