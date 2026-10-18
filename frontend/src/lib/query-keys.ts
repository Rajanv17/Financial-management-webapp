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
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
};
