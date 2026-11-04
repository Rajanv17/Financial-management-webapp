import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../config";
import { createNotification } from "../services";
import { notificationKeys, toISTDateKey } from "../utils";

async function makeUser(tag: string) {
  return prisma.user.create({
    data: {
      username: `notif_${tag}_${Date.now()}`,
      email: `notif_${tag}_${Date.now()}@test.local`,
      passwordHash: "x",
    },
  }); // ADJUST if you have a test factory
}

const base = {
  type: "recurring_due_soon" as const,
  title: "Rent due in 3 days",
  message: "Rent (₹12,000) is due on 2026-11-07.",
};

describe("createNotification", () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    userId = (await makeUser("a")).id;
    otherUserId = (await makeUser("b")).id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a notification and returns true", async () => {
    const created = await createNotification({
      ...base,
      userId,
      dedupeKey: "k1",
    });
    expect(created).toBe(true);
    expect(await prisma.notification.count({ where: { userId } })).toBe(1);
  });

  it("is a no-op and returns false for the same (user, dedupeKey)", async () => {
    await createNotification({ ...base, userId, dedupeKey: "k1" });
    const again = await createNotification({
      ...base,
      userId,
      dedupeKey: "k1",
    });
    expect(again).toBe(false);
    expect(await prisma.notification.count({ where: { userId } })).toBe(1);
  });

  it("does not duplicate under concurrent calls", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        createNotification({ ...base, userId, dedupeKey: "race" }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await prisma.notification.count({ where: { userId } })).toBe(1);
  });

  it("allows the same key for different users", async () => {
    expect(await createNotification({ ...base, userId, dedupeKey: "k1" })).toBe(
      true,
    );
    expect(
      await createNotification({
        ...base,
        userId: otherUserId,
        dedupeKey: "k1",
      }),
    ).toBe(true);
  });

  it("allows different keys for the same user", async () => {
    expect(await createNotification({ ...base, userId, dedupeKey: "k1" })).toBe(
      true,
    );
    expect(await createNotification({ ...base, userId, dedupeKey: "k2" })).toBe(
      true,
    );
  });

  it("works inside a transaction", async () => {
    await prisma.$transaction(async (tx) => {
      expect(
        await createNotification({ ...base, userId, dedupeKey: "tx" }, tx),
      ).toBe(true);
    });
    expect(await prisma.notification.count({ where: { userId } })).toBe(1);
  });
});

describe("notificationKeys", () => {
  it("is deterministic per event", () => {
    expect(notificationKeys.recurringCreated("abc", "2026-11-07")).toBe(
      notificationKeys.recurringCreated("abc", "2026-11-07"),
    );
    expect(notificationKeys.recurringCreated("abc", "2026-11-07")).not.toBe(
      notificationKeys.recurringSkipped("abc", "2026-11-07"),
    );
  });

  it("formats dates in IST", () => {
    expect(toISTDateKey(new Date("2026-11-03T20:00:00Z"))).toBe("2026-11-04");
  });
});
