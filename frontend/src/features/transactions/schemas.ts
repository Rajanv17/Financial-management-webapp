import { z } from "zod";
import { accountTypeSchema } from "../accounts/schemas";
import { categorySchema, transactionTypeSchema } from "../categories/schemas";

export const paymentMethodSchema = z.enum([
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "UPI",
  "OTHER",
]);

export const categoryEmbedSchema = categorySchema.pick({
  id: true,
  name: true,
  icon: true,
  color: true,
  type: true,
});

export const accountEmbedSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  categoryId: z.string(),
  accountId: z.string(),
  title: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  date: z.string(),
  description: z.string().nullable(),
  paymentMethod: paymentMethodSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: categoryEmbedSchema.optional(),
  account: accountEmbedSchema.optional(),
});

export const transactionListSchema = z.object({
  items: z.array(transactionSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const transactionFormSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.uuid("Choose a category"),
  accountId: z.uuid("Choose an account"),
  paymentMethod: paymentMethodSchema,
  description: z.string().max(150, "Description must be at most 150 characters"),
  title: z.string().trim().min(1, "Title is required").max(100),
});
