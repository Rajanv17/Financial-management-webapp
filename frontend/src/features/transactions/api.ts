import { api } from "@/lib/api";
import type {
  Transaction,
  TransactionList,
  TransactionUpdatePayload,
  TransactionWritePayload,
} from "./types";

export type TransactionListParams = {
  page?: number;
  limit?: number;
  type?: "income" | "expense";
  categoryId?: string;
  accountId?: string;
  from?: string;
  to?: string;
  q?: string;
  sortBy?: "date" | "amount" | "title";
  sortOrder?: "asc" | "desc";
};

const toQuery = (params: TransactionListParams = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const fetchTransactions = (params?: TransactionListParams) =>
  api<TransactionList>(`/transactions${toQuery(params)}`);

export const createTransaction = (input: TransactionWritePayload) =>
  api<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateTransaction = (id: string, input: TransactionUpdatePayload) =>
  api<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteTransaction = (id: string) =>
  api<null>(`/transactions/${id}`, { method: "DELETE" });
