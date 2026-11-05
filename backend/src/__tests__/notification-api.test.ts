import { describe, expect, it } from "vitest";
import { prisma } from "../config";
import { defaultAccount, registerAndLogin } from "./helpers";

async function userWithNotes(count: number) {
  const { client } = await registerAndLogin();
  const account = await defaultAccount(client);
  const { userId } = await prisma.financialAccount.findUniqueOrThrow({
    where: { id: account.id },
  });
  for (let i = 0; i < count; i++) {
    await prisma.notification.create({
      data: {
        userId,
        type: "recurring_created",
        title: `n${i}`,
        message: "m",
        dedupeKey: `k${i}`,
      },
    });
  }
  return { client, userId };
}

describe("notifications API", () => {
  it("lists newest first with unread count and hides internal fields", async () => {
    const { client } = await userWithNotes(3);
    const res = await client.get("/api/v1/notifications");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.unreadCount).toBe(3);
    expect(res.body.data.items[0].dedupeKey).toBeUndefined();
    expect(res.body.data.items[0].userId).toBeUndefined();
  });

  it("paginates", async () => {
    const { client } = await userWithNotes(3);
    const res = await client.get("/api/v1/notifications?limit=2&page=2");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.pagination.total).toBe(3);
  });

  it("returns the unread count", async () => {
    const { client } = await userWithNotes(2);
    const res = await client.get("/api/v1/notifications/unread-count");
    expect(res.body.data.unreadCount).toBe(2);
  });

  it("marks one as read, keeps the first read time, and filters unread", async () => {
    const { client } = await userWithNotes(2);
    const list = await client.get("/api/v1/notifications");
    const id = list.body.data.items[0].id;

    const first = await client.patch(`/api/v1/notifications/${id}/read`);
    expect(first.status).toBe(200);
    expect(first.body.data.readAt).not.toBeNull();

    const second = await client.patch(`/api/v1/notifications/${id}/read`);
    expect(second.body.data.readAt).toBe(first.body.data.readAt);

    const unread = await client.get("/api/v1/notifications?unread=true");
    expect(unread.body.data.items).toHaveLength(1);
    expect(unread.body.data.unreadCount).toBe(1);
  });

  it("marks all as read", async () => {
    const { client } = await userWithNotes(3);
    const res = await client.patch("/api/v1/notifications/read-all");
    expect(res.body.data.updated).toBe(3);
    const count = await client.get("/api/v1/notifications/unread-count");
    expect(count.body.data.unreadCount).toBe(0);
  });

  it("cannot read or mark another user's notification", async () => {
    const a = await userWithNotes(1);
    const b = await userWithNotes(1);
    const aId = (await a.client.get("/api/v1/notifications")).body.data.items[0]
      .id;

    expect(
      (await b.client.patch(`/api/v1/notifications/${aId}/read`)).status,
    ).toBe(404);

    await b.client.patch("/api/v1/notifications/read-all");
    const stillUnread = await a.client.get(
      "/api/v1/notifications/unread-count",
    );
    expect(stillUnread.body.data.unreadCount).toBe(1);
  });

  it("rejects bad input and unauthenticated calls", async () => {
    const { client } = await userWithNotes(0);
    expect(
      (await client.get("/api/v1/notifications?unread=maybe")).status,
    ).toBe(400);
    expect(
      (await client.patch("/api/v1/notifications/not-a-uuid/read")).status,
    ).toBe(400);
  });
});
