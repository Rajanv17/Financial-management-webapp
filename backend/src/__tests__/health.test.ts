import { describe, expect, it } from "vitest";
import { api } from "./helpers";

describe("health", () => {
  it("GET /health returns 200 { status: ok }", async () => {
    const res = await api().get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
