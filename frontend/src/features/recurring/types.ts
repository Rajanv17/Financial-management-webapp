import type { z } from "zod";
import type { PaymentMethod } from "@/features/transactions/types";
import type { frequencySchema, recurringBillFormSchema } from "./schemas";

export type RecurringFrequency = z.infer<typeof frequencySchema>;
export type RecurringBillFormValues = z.infer<typeof recurringBillFormSchema>;

export type RecurringBill = {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: RecurringFrequency;
  nextDue: string;
  paymentMethod: PaymentMethod;
  description: string;
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const PREVIEW_BILL_CATEGORIES = [
  "Housing",
  "Food & Drinks",
  "Shopping",
  "Transportation",
  "Life & Entertainment",
  "Vehicle",
  "Other financial expense",
] as const;
