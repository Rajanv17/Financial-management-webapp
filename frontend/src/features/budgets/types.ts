import type { z } from "zod";
import type {
  budgetEditFormSchema,
  budgetFormSchema,
  budgetSchema,
  budgetStatusSchema,
  budgetSummarySchema,
  budgetWithStatsSchema,
} from "./schemas";

export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type BudgetWithStats = z.infer<typeof budgetWithStatsSchema>;
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
export type BudgetEditFormValues = z.infer<typeof budgetEditFormSchema>;

export type BudgetWritePayload = {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
};

export type BudgetUpdatePayload = {
  amount?: number;
  isActive?: boolean;
};
