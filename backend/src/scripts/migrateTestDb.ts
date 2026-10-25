import { execSync } from "node:child_process";
import { loadAndAssertTestDatabase } from "./assertTestDatabase";

const databaseUrl = loadAndAssertTestDatabase();

execSync("npx prisma migrate deploy", {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit",
});
