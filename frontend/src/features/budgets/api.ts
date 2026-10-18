import { api } from "@/lib/api";
import type { Budget, BudgetFormInput, BudgetWithStats } from "./types";

export const fetchBudgets = (month: number, year: number) =>
  api<BudgetWithStats[]>(`/budgets?month=${month}&year=${year}`);

export const createBudget = (input: BudgetFormInput) =>
  api<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateBudget = (
  id: string,
  input: { amount?: number; isActive?: boolean },
) =>
  api<Budget>(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const archiveBudget = (id: string) =>
  api<Budget>(`/budgets/${id}`, { method: "DELETE" });
