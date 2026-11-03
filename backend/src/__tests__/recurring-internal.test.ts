import { describe, expect, it } from "vitest";
import { registerAndLogin } from "./helpers";

process.env.RECURRING_CRON_SECRET = "test-secret-1234567890";

describe("POST /internal/recurring/run", () => {
  it("rejects a missing secret header with 401", async () => {
    const { client } = await registerAndLogin();
    const res = await client.post("/api/internal/recurring/run");
    expect(res.status).toBe(401);
  });

  it("rejects a wrong secret with 401", async () => {
    const { client } = await registerAndLogin();
    const res = await client
      .post("/api/internal/recurring/run")
      .set("x-cron-secret", "wrong-secret-1234567890");
    expect(res.status).toBe(401);
  });

  it("runs the processor with the correct secret", async () => {
    const { client } = await registerAndLogin();
    const res = await client
      .post("/api/internal/recurring/run")
      .set("x-cron-secret", "test-secret-1234567890");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      created: expect.any(Number),
      skipped: expect.any(Number),
      alreadyProcessed: expect.any(Number),
      failed: expect.any(Number),
    });
  });
});
