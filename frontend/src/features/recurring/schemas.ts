import { z } from "zod";
import { paymentMethodSchema } from "@/features/transactions/schemas";

export const frequencySchema = z.enum(["weekly", "monthly", "yearly"]);

export const recurringBillFormSchema = z.object({
  title: z.string().trim().min(1, "Bill name is required").max(100),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  frequency: frequencySchema,
  nextDue: z.string().min(1, "Next due date is required"),
  category: z.string().min(1, "Choose a category"),
  paymentMethod: paymentMethodSchema,
  description: z.string().max(150, "Notes must be at most 150 characters"),
});
