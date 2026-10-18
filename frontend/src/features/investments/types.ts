import type { z } from "zod";
import type { investmentFormSchema, investmentTypeSchema } from "./schemas";

export type InvestmentType = z.infer<typeof investmentTypeSchema>;
export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

export type Investment = {
  id: string;
  name: string;
  type: InvestmentType;
  initialAmount: number;
  currentValue: number;
  quantity: number | null;
  purchaseDate: string;
  notes: string;
};

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  stocks: "Stocks",
  mutual_funds: "Mutual Funds",
  etf: "ETFs",
  fixed_deposit: "Fixed Deposits",
  gold: "Gold",
  other: "Other",
};
