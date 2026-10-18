import type { TransactionListParams } from "@/features/transactions/api";

export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (params: TransactionListParams) =>
      ["transactions", "list", params] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (archived = false) => ["categories", "list", { archived }] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    list: (month: number, year: number) =>
      ["budgets", "list", { month, year }] as const,
    summary: (month: number, year: number) =>
      ["budgets", "summary", { month, year }] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (from: string, to: string) =>
      ["dashboard", "summary", { from, to }] as const,
  },
  user: {
    profile: ["user", "profile"] as const,
  },
};
