import { z } from "zod";

export const investmentTypeSchema = z.enum([
  "stocks",
  "mutual_funds",
  "etf",
  "fixed_deposit",
  "gold",
  "other",
]);

const amountField = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const investmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  type: investmentTypeSchema,
  initialAmount: amountField,
  currentValue: amountField,
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+(\.\d{1,8})?$/.test(value),
      "Quantity must be a positive number",
    )
    .refine(
      (value) => value === "" || Number(value) > 0,
      "Quantity must be greater than zero",
    ),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().max(150, "Notes must be at most 150 characters"),
});
