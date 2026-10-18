import { execSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeEach } from "vitest";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Integration tests need a separate Postgres database.",
  );
}

if (testDatabaseUrl === databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must differ from DATABASE_URL so tests never touch the development database.",
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
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
  await prisma.category.deleteMany({ where: { isDefault: false } });
  await prisma.user.deleteMany();
  await seedDefaultCategories();
});

afterAll(async () => {
  await prisma.$disconnect();
});
