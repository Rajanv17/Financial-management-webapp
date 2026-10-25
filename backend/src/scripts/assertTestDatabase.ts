import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const TEST_ENV_PATH = path.resolve(process.cwd(), ".env.test");

export const databaseNameFromUrl = (url: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, "")).split(
    "/",
  )[0];
  if (!name) {
    throw new Error("DATABASE_URL is missing a database name");
  }
  return name;
};

export const loadAndAssertTestDatabase = (): string => {
  if (fs.existsSync(TEST_ENV_PATH)) {
    const result = dotenv.config({ path: TEST_ENV_PATH, override: true });
    if (result.error) {
      throw new Error(`Could not load ${TEST_ENV_PATH}: ${result.error.message}`);
    }
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.test.example to .env.test or set DATABASE_URL in the environment (database name must end with \"_test\").",
    );
  }

  const name = databaseNameFromUrl(databaseUrl);
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run against database "${name}". DATABASE_URL must end with "_test".`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
};
