import type { z } from "zod";
import type {
  paymentMethodSchema,
  transactionFormSchema,
  transactionListSchema,
  transactionSchema,
} from "./schemas";

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionList = z.infer<typeof transactionListSchema>;
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export type TransactionWritePayload = {
  title: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  accountId: string;
  date: string;
  description: string | null;
  paymentMethod: PaymentMethod;
};

export type TransactionUpdatePayload = Omit<TransactionWritePayload, "accountId"> & {
  accountId?: string;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  OTHER: "Other",
};
