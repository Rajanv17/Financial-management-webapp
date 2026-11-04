import { z } from "zod";

export const frequencySchema = z.enum(["weekly", "monthly", "yearly"]);

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

export const recurringBillFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(["income", "expense"]),
    amount: z
      .string()
      .trim()
      .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid amount (max 2 decimals)")
      .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
    frequency: frequencySchema,
    startDate: z.string().regex(dateOnly, "Pick a start date"),
    endDate: z.string().regex(dateOnly, "Pick a valid date").or(z.literal("")),
    accountId: z.string().min(1, "Select an account"),
    categoryId: z.string().min(1, "Select a category"),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: "End date cannot be before the start date",
    path: ["endDate"],
  });
