import { api } from "@/lib/api";
import type { Account, AccountSummary, AccountWritePayload } from "./types";

export const fetchAccounts = (archived = false) => {
  const query = archived ? "?archived=true" : "";
  return api<Account[]>(`/accounts${query}`);
};

export const fetchAccount = (id: string) => api<Account>(`/accounts/${id}`);

export const fetchAccountSummary = () =>
  api<AccountSummary>("/accounts/summary");

export const createAccount = (input: AccountWritePayload) =>
  api<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateAccount = (id: string, input: AccountWritePayload) =>
  api<Account>(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const archiveAccount = (id: string) =>
  api<Account>(`/accounts/archive/${id}`, { method: "PATCH" });

export const restoreAccount = (id: string) =>
  api<Account>(`/accounts/restore/${id}`, { method: "PATCH" });
