import { api } from "@/lib/api";
import type {
  Budget,
  BudgetSummary,
  BudgetUpdatePayload,
  BudgetWithStats,
  BudgetWritePayload,
} from "./types";

export const fetchBudgets = (month: number, year: number) =>
  api<BudgetWithStats[]>(`/budgets?month=${month}&year=${year}`);

export const fetchBudgetSummary = (month: number, year: number) =>
  api<BudgetSummary>(`/budgets/summary?month=${month}&year=${year}`);

export const createBudget = (input: BudgetWritePayload) =>
  api<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateBudget = (id: string, input: BudgetUpdatePayload) =>
  api<Budget>(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const archiveBudget = (id: string) =>
  api<Budget>(`/budgets/${id}`, { method: "DELETE" });
