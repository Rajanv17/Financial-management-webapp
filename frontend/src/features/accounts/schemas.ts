import { z } from "zod";

export const accountTypeSchema = z.enum([
  "bank",
  "cash",
  "wallet",
  "credit_card",
  "other",
]);

const moneyStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places");

export const accountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  openingBalance: moneyStringSchema,
  currency: z.string(),
  institutionName: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  isDefault: z.boolean(),
  isArchived: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  balance: moneyStringSchema,
});

export const accountSummarySchema = z.object({
  netBalance: moneyStringSchema,
  byType: z.array(
    z.object({
      type: accountTypeSchema,
      total: moneyStringSchema,
    }),
  ),
  accountCount: z.number().int(),
});

export const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
  type: accountTypeSchema,
  institutionName: z
    .string()
    .trim()
    .max(100, "Institution name must be 100 characters or fewer"),
  openingBalance: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^-?\d{1,10}(\.\d{1,2})?$/.test(value),
      "Opening balance must be a number with at most 2 decimal places",
    ),
});
