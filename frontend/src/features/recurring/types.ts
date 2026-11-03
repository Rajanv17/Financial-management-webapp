import type { z } from "zod";
import type { frequencySchema, recurringBillFormSchema } from "./schemas";

export type RecurringFrequency = z.infer<typeof frequencySchema>;
export type RecurringFormValues = z.infer<typeof recurringBillFormSchema>;
export type RecurringType = "income" | "expense";

export type RecurringPayment = {
  id: string;
  name: string;
  type: RecurringType;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  endDate: string | null;
  isActive: boolean;
  accountId: string;
  categoryId: string;
  account: { id: string; name: string; type: string };
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type RecurringWritePayload = {
  name: string;
  type: RecurringType;
  amount: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  accountId: string;
  categoryId: string;
};

export type RecurringUpdatePayload = {
  name?: string;
  amount?: string;
  accountId?: string;
  categoryId?: string;
  endDate?: string | null;
};

export type RecurringExecution = {
  id: string;
  scheduledFor: string;
  status: "created" | "skipped";
  transactionId: string | null;
  reason: string | null;
  executedAt: string;
};

export type RecurringExecutionPage = {
  items: RecurringExecution[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
