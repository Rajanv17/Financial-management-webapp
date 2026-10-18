import { describe, expect, it } from "vitest";
import { defaultCategories, registerAndLogin } from "./helpers";

describe("categories", () => {
  it("cannot archive a default category", async () => {
    const { client } = await registerAndLogin();
    const { expense } = await defaultCategories(client);

    const res = await client.patch(`/api/v1/categories/archive/${expense.id}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Category not found");

    const list = await client.get("/api/v1/categories");
    expect(list.status).toBe(200);
    const stillDefault = (list.body.data as { id: string; isArchived: boolean }[]).find(
      (category) => category.id === expense.id,
    );
    expect(stillDefault?.isArchived).toBe(false);
  });

  it("rejects a duplicate name and type", async () => {
    const { client } = await registerAndLogin();
    const payload = { name: "Coffee", type: "expense" };

    const first = await client.post("/api/v1/categories").send(payload);
    expect(first.status).toBe(201);

    const second = await client.post("/api/v1/categories").send(payload);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe(
      "Category with the same name and type already exists (it may be archived)",
    );
  });
});
