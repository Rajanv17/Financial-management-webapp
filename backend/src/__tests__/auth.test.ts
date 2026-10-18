import { describe, expect, it } from "vitest";
import { api, cookieNames, getCookie, registerAndLogin, registerUser } from "./helpers";

describe("auth", () => {
  it("register then login sets both cookies", async () => {
    const { loginRes } = await registerAndLogin();
    const names = cookieNames(loginRes);

    expect(names).toEqual(expect.arrayContaining(["accessToken", "refreshToken"]));
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
