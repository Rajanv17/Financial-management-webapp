import { describe, expect, it } from "vitest";
import { defaultAccount, defaultCategories, registerAndLogin } from "./helpers";

describe("user isolation", () => {
  it("user B cannot read, update or delete user A's transaction", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();
    const { expense } = await defaultCategories(userA.client);
    const account = await defaultAccount(userA.client);

    const created = await userA.client.post("/api/v1/transactions").send({
      title: "A's lunch",
      amount: 120,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
      date: "2026-03-01T12:00:00.000Z",
    });
    expect(created.status).toBe(201);
    const transactionId = created.body.data.id as string;

    const listB = await userB.client.get("/api/v1/transactions");
    expect(listB.status).toBe(200);
    const ids = (listB.body.data.items as { id: string }[]).map((row) => row.id);
    expect(ids).not.toContain(transactionId);

    const updateB = await userB.client
      .patch(`/api/v1/transactions/${transactionId}`)
      .send({ title: "hijacked" });
    expect(updateB.status).toBe(404);

    const deleteB = await userB.client.delete(
      `/api/v1/transactions/${transactionId}`,
    );
    expect(deleteB.status).toBe(404);

    const listA = await userA.client.get("/api/v1/transactions");
    expect(listA.status).toBe(200);
    expect(
      (listA.body.data.items as { id: string }[]).map((row) => row.id),
    ).toContain(transactionId);
  });
});
