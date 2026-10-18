import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/__tests__/**"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/__tests__/**/*.test.ts"],
          setupFiles: ["./src/__tests__/setup.ts"],
          fileParallelism: false,
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
