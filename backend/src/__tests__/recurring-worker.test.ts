import { describe, expect, it } from "vitest";
import { prisma } from "../config";
import { processDueRecurringPayments } from "../services";
import {
  createAccount,
  defaultAccount,
  defaultCategories,
  registerAndLogin,
} from "./helpers";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

const NOW = new Date("2026-11-03T10:00:00.000Z");

async function seed(opts: {
  start: string;
  frequency?: "weekly" | "monthly" | "yearly";
  endDate?: string;
  isActive?: boolean;
  useSecondAccount?: boolean;
}) {
  const { client } = await registerAndLogin();
  const { expense } = await defaultCategories(client);
  const account = opts.useSecondAccount
    ? await createAccount(client, { name: "Rent account" })
    : await defaultAccount(client);

  const row = await prisma.financialAccount.findUniqueOrThrow({
    where: { id: account.id },
  });

  const payment = await prisma.recurringPayment.create({
    data: {
      userId: row.userId,
      accountId: account.id,
      categoryId: expense.id,
      name: "Rent",
      type: "expense",
      amount: 499,
      frequency: opts.frequency ?? "monthly",
      startDate: d(opts.start),
      nextDueDate: d(opts.start),
      endDate: opts.endDate ? d(opts.endDate) : null,
      isActive: opts.isActive ?? true,
    },
  });

  return { client, account, userId: row.userId, payment };
}

const txnCount = (userId: string) =>
  prisma.transaction.count({ where: { userId } });
const reload = (id: string) =>
  prisma.recurringPayment.findUniqueOrThrow({ where: { id } });
const notesFor = (userId: string) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

describe("processDueRecurringPayments", () => {
  it("creates exactly one transaction when run twice", async () => {
    const { userId, payment } = await seed({ start: "2026-11-03" });

    await processDueRecurringPayments(NOW);
    await processDueRecurringPayments(NOW);

    expect(await txnCount(userId)).toBe(1);
    expect(
      await prisma.recurringExecution.count({
        where: { recurringPaymentId: payment.id },
      }),
    ).toBe(1);
    expect(iso((await reload(payment.id)).nextDueDate)).toBe("2026-12-03");
  });

  it("creates exactly one transaction when two runs happen concurrently", async () => {
    const { userId } = await seed({ start: "2026-11-03" });

    await Promise.all([
      processDueRecurringPayments(NOW),
      processDueRecurringPayments(NOW),
    ]);

    expect(await txnCount(userId)).toBe(1);
  });

  it("catches up on every missed occurrence", async () => {
    const { userId, payment } = await seed({ start: "2026-08-03" });

    await processDueRecurringPayments(NOW);
    expect(await txnCount(userId)).toBe(4);
    expect(iso((await reload(payment.id)).nextDueDate)).toBe("2026-12-03");

    await processDueRecurringPayments(NOW);
    expect(await txnCount(userId)).toBe(4);
  });

  it("skips and records a reason when the account is archived", async () => {
    const { client, account, userId, payment } = await seed({
      start: "2026-11-03",
      useSecondAccount: true,
    });
    const archived = await client.patch(
      `/api/v1/accounts/archive/${account.id}`,
    );
    expect(archived.status).toBe(200);

    await processDueRecurringPayments(NOW);

    expect(await txnCount(userId)).toBe(0);
    const execution = await prisma.recurringExecution.findFirstOrThrow({
      where: { recurringPaymentId: payment.id },
    });
    expect(execution.status).toBe("skipped");
    expect(execution.reason).toBe("Account is archived");
    expect(iso((await reload(payment.id)).nextDueDate)).toBe("2026-12-03");
  });

  it("stops and deactivates after endDate", async () => {
    const { userId, payment } = await seed({
      start: "2026-08-03",
      endDate: "2026-09-30",
    });

    await processDueRecurringPayments(NOW);

    expect(await txnCount(userId)).toBe(2);
    const after = await reload(payment.id);
    expect(after.isActive).toBe(false);
    expect(iso(after.nextDueDate)).toBe("2026-10-03");
  });

  it("ignores paused payments", async () => {
    const { userId } = await seed({ start: "2026-11-03", isActive: false });

    await processDueRecurringPayments(NOW);

    expect(await txnCount(userId)).toBe(0);
  });
});

describe("recurring notifications", () => {
  it("creates one 'created' notification, even when run twice", async () => {
    const { userId, payment } = await seed({ start: "2026-11-03" });

    await processDueRecurringPayments(NOW);
    await processDueRecurringPayments(NOW);

    const notes = await notesFor(userId);
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe("recurring_created");
    expect(notes[0].dedupeKey).toBe(
      `recurring:${payment.id}:2026-11-03:created`,
    );
    expect(notes[0].message).toContain("499");
  });

  it("creates one notification when two runs happen concurrently", async () => {
    const { userId } = await seed({ start: "2026-11-03" });

    await Promise.all([
      processDueRecurringPayments(NOW),
      processDueRecurringPayments(NOW),
    ]);

    expect(await notesFor(userId)).toHaveLength(1);
  });

  it("creates a 'skipped' notification with the reason", async () => {
    const { client, account, userId } = await seed({
      start: "2026-11-03",
      useSecondAccount: true,
    });
    await client.patch(`/api/v1/accounts/archive/${account.id}`);

    await processDueRecurringPayments(NOW);

    const notes = await notesFor(userId);
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe("recurring_skipped");
    expect(notes[0].message).toContain("Account is archived");
  });

  it("creates one notification per caught-up occurrence", async () => {
    const { userId } = await seed({ start: "2026-08-03" }); // Aug, Sep, Oct, Nov

    await processDueRecurringPayments(NOW);
    await processDueRecurringPayments(NOW);

    const notes = await notesFor(userId);
    expect(notes).toHaveLength(4);
    expect(new Set(notes.map((n) => n.dedupeKey)).size).toBe(4);
  });

  it("creates a due-soon reminder once when the due date is 3 days away", async () => {
    const { userId, payment } = await seed({ start: "2026-11-06" });

    await processDueRecurringPayments(NOW);
    await processDueRecurringPayments(NOW);

    const notes = await notesFor(userId);
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe("recurring_due_soon");
    expect(notes[0].title).toContain("in 3 days");
    expect(notes[0].dedupeKey).toBe(
      `recurring:${payment.id}:2026-11-06:due_soon`,
    );
    expect(await txnCount(userId)).toBe(0); // reminder must not create a transaction
  });

  it("sends no reminder when the due date is outside the window", async () => {
    const { userId } = await seed({ start: "2026-11-07" }); // 4 days away
    await processDueRecurringPayments(NOW);
    expect(await notesFor(userId)).toHaveLength(0);
  });

  it("sends no reminder for a paused payment", async () => {
    const { userId } = await seed({ start: "2026-11-06", isActive: false });
    await processDueRecurringPayments(NOW);
    expect(await notesFor(userId)).toHaveLength(0);
  });
});
