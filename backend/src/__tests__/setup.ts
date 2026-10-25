import { execSync } from "node:child_process";
import { afterAll, beforeEach } from "vitest";
import { loadAndAssertTestDatabase } from "../scripts/assertTestDatabase";

const testDatabaseUrl = loadAndAssertTestDatabase();
process.env.AUTH_RATE_LIMIT_MAX = "10000";

execSync("npx prisma migrate deploy", {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  stdio: "inherit",
});

const { prisma } = await import("../config/prisma");
const { defaultCategories } = await import("../config/defaultCategories");

const seedDefaultCategories = async () => {
  const existingDefaults = await prisma.category.count({
    where: { isDefault: true },
  });
  if (existingDefaults === 0) {
    await prisma.category.createMany({ data: defaultCategories });
  }
};

await seedDefaultCategories();

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.financialAccount.deleteMany();
  await prisma.category.deleteMany({ where: { isDefault: false } });
  await prisma.user.deleteMany();
  await seedDefaultCategories();
});

afterAll(async () => {
  await prisma.$disconnect();
});
