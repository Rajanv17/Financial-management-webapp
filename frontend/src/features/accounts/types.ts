import type { z } from "zod";
import type {
  accountFormSchema,
  accountSchema,
  accountSummarySchema,
  accountTypeSchema,
} from "./schemas";

export type AccountType = z.infer<typeof accountTypeSchema>;
export type Account = z.infer<typeof accountSchema>;
export type AccountSummary = z.infer<typeof accountSummarySchema>;
export type AccountFormValues = z.infer<typeof accountFormSchema>;

export type AccountWritePayload = {
  name: string;
  type: AccountType;
  openingBalance?: string;
  institutionName?: string | null;
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit Card",
  other: "Other",
};

export const ACCOUNT_TYPES: AccountType[] = [
  "bank",
  "cash",
  "wallet",
  "credit_card",
  "other",
];
