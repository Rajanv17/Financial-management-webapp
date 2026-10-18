import { z } from "zod";
import { categorySchema } from "../categories/schemas";

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

export const budgetFormSchema = z.object({
  categoryId: z.uuid("categoryId is invalid"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
