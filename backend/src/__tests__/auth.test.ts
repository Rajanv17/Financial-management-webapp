import { describe, expect, it } from "vitest";
import {
  api,
  cookieNames,
  getCookie,
  listAccounts,
  registerAndLogin,
  registerUser,
} from "./helpers";

describe("registration", () => {
  it("creates exactly one default Unassigned account", async () => {
    const { client } = await registerAndLogin();
    const accounts = await listAccounts(client);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      name: "Unassigned",
      type: "other",
      isDefault: true,
      isArchived: false,
    });
  });
});

describe("auth", () => {
  it("register then login sets both cookies", async () => {
    const { loginRes } = await registerAndLogin();
    const names = cookieNames(loginRes);

    expect(names).toEqual(
      expect.arrayContaining(["accessToken", "refreshToken"]),
    );
    expect(getCookie(loginRes, "accessToken")).toBeTruthy();
    expect(getCookie(loginRes, "refreshToken")).toBeTruthy();
  });

  it("wrong password returns 401", async () => {
    const { username } = await registerUser();
    const res = await api()
      .post("/api/v1/user/login")
      .send({ username, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("protected route without cookie returns 401", async () => {
    const res = await api().get("/api/v1/user/profile");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("refresh rotates tokens and the old refresh token then returns 401", async () => {
    const { loginRes } = await registerAndLogin();
    const oldRefresh = getCookie(loginRes, "refreshToken");
    expect(oldRefresh).toBeTruthy();

    const refreshed = await api()
      .post("/api/v1/user/refresh-token")
      .send({ refreshToken: oldRefresh });

    expect(refreshed.status).toBe(200);
    const newRefresh = getCookie(refreshed, "refreshToken");
    expect(newRefresh).toBeTruthy();
    expect(newRefresh).not.toBe(oldRefresh);
    expect(getCookie(refreshed, "accessToken")).toBeTruthy();

    const reused = await api()
      .post("/api/v1/user/refresh-token")
      .send({ refreshToken: oldRefresh });

    expect(reused.status).toBe(401);
    expect(reused.body.success).toBe(false);
  });
});

describe("user update ownership", () => {
  it("rejects updating another user's id and leaves both users unchanged", async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();

    const res = await b.client
      .patch(`/api/v1/user/update/${a.user.id}`)
      .send({ username: `renamed_${Date.now()}` });
    expect(res.status).toBe(403);

    const profileA = await a.client.get("/api/v1/user/profile");
    const profileB = await b.client.get("/api/v1/user/profile");
    expect(profileA.body.data.username).toBe(a.username);
    expect(profileB.body.data.username).toBe(b.username);
  });

  it("allows updating your own id", async () => {
    const a = await registerAndLogin();
    const newName = `renamed_${Date.now()}`.slice(0, 40);

    const res = await a.client
      .patch(`/api/v1/user/update/${a.user.id}`)
      .send({ username: newName });
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(newName);
  });
});
