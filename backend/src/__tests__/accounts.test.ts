import { describe, expect, it } from "vitest";
import {
  createAccount,
  defaultAccount,
  defaultCategories,
  listAccounts,
  registerAndLogin,
} from "./helpers";

describe("accounts", () => {
  it("returns 404 for another user's account", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();
    const accountA = await defaultAccount(userA.client);

    const res = await userB.client.get(`/api/v1/accounts/${accountA.id}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Account not found");
  });

  it("rejects updates and archive of the default account with 400", async () => {
    const { client } = await registerAndLogin();
    const unassigned = await defaultAccount(client);

    const updated = await client.put(`/api/v1/accounts/${unassigned.id}`).send({
      name: "Renamed",
    });
    expect(updated.status).toBe(400);
    expect(updated.body.message).toBe("The default account cannot be modified");

    const archived = await client.patch(
      `/api/v1/accounts/archive/${unassigned.id}`,
    );
    expect(archived.status).toBe(400);
    expect(archived.body.message).toBe("The default account cannot be modified");
  });

  it("rejects a duplicate name with 400", async () => {
    const { client } = await registerAndLogin();
    const payload = { name: "Wallet", type: "cash" };

    const first = await client.post("/api/v1/accounts").send(payload);
    expect(first.status).toBe(201);

    const second = await client.post("/api/v1/accounts").send(payload);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe(
      "An account with the same name already exists (it may be archived)",
    );
  });

  it("archives and restores a custom account", async () => {
    const { client } = await registerAndLogin();
    const created = await createAccount(client, { name: "Travel card" });

    const archived = await client.patch(
      `/api/v1/accounts/archive/${created.id}`,
    );
    expect(archived.status).toBe(200);
    expect(archived.body.data.isArchived).toBe(true);

    const active = await listAccounts(client);
    expect(active.map((row) => row.id)).not.toContain(created.id);

    const archivedList = await listAccounts(client, { archived: "true" });
    expect(archivedList.map((row) => row.id)).toContain(created.id);

    const restored = await client.patch(
      `/api/v1/accounts/restore/${created.id}`,
    );
    expect(restored.status).toBe(200);
    expect(restored.body.data.isArchived).toBe(false);

    const activeAgain = await listAccounts(client);
    expect(activeAgain.map((row) => row.id)).toContain(created.id);
  });

  it("sets balance to openingBalance plus income minus expense", async () => {
    const { client } = await registerAndLogin();
    const { expense, income } = await defaultCategories(client);
    const account = await createAccount(client, {
      name: "Savings",
      type: "bank",
      openingBalance: "100.00",
    });

    const incomeTx = await client.post("/api/v1/transactions").send({
      title: "Deposit",
      amount: 50,
      type: "income",
      categoryId: income.id,
      accountId: account.id,
    });
    expect(incomeTx.status).toBe(201);

    const expenseTx = await client.post("/api/v1/transactions").send({
      title: "Withdrawal",
      amount: 30,
      type: "expense",
      categoryId: expense.id,
      accountId: account.id,
    });
    expect(expenseTx.status).toBe(201);

    const fetched = await client.get(`/api/v1/accounts/${account.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.balance).toBe("120.00");
  });

  it("summary netBalance matches the sum of active account balances", async () => {
    const { client } = await registerAndLogin();
    const { expense, income } = await defaultCategories(client);
    const unassigned = await defaultAccount(client);
    const savings = await createAccount(client, {
      name: "Savings",
      type: "bank",
      openingBalance: "100.00",
    });

    const incomeTx = await client.post("/api/v1/transactions").send({
      title: "Deposit",
      amount: 50,
      type: "income",
      categoryId: income.id,
      accountId: savings.id,
    });
    expect(incomeTx.status).toBe(201);

    const expenseTx = await client.post("/api/v1/transactions").send({
      title: "Withdrawal",
      amount: 30,
      type: "expense",
      categoryId: expense.id,
      accountId: savings.id,
    });
    expect(expenseTx.status).toBe(201);

    const list = await listAccounts(client);
    const expectedNet = list
      .reduce((sum, row) => sum + Number(row.balance), 0)
      .toFixed(2);

    const summary = await client.get("/api/v1/accounts/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.data.netBalance).toBe(expectedNet);
    expect(list.map((row) => row.id).sort()).toEqual(
      [unassigned.id, savings.id].sort(),
    );
  });
});
