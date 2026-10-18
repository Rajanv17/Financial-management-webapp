import { z } from "zod";
import { categorySchema } from "../categories/schemas";

const amountField = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const budgetStatusSchema = z.enum([
  "under_limit",
  "near_limit",
  "exceeded",
]);

export const budgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  categoryId: z.string(),
  amount: z.number(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  week: z.number().nullable(),
  month: z.number(),
  year: z.number(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const budgetWithStatsSchema = budgetSchema.extend({
  category: categorySchema,
  spent: z.number(),
  remaining: z.number(),
  percentageUsed: z.number(),
  status: budgetStatusSchema,
});

export const budgetSummarySchema = z.object({
  totalBudget: z.number(),
  totalSpent: z.number(),
  remaining: z.number(),
  percentageUsed: z.number(),
});

export const budgetFormSchema = z.object({
  categoryId: z.uuid("Choose a category"),
  amount: amountField,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const budgetEditFormSchema = z.object({
  amount: amountField,
  isActive: z.boolean(),
});
