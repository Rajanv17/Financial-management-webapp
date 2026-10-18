import type { z } from "zod";
import type {
  budgetFormSchema,
  budgetSchema,
  budgetStatusSchema,
  budgetWithStatsSchema,
} from "./schemas";

export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type BudgetWithStats = z.infer<typeof budgetWithStatsSchema>;
export type BudgetFormInput = z.infer<typeof budgetFormSchema>;
