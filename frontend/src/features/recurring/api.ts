import { api } from "@/lib/api";
import type {
  RecurringExecutionPage,
  RecurringFormValues,
  RecurringPayment,
  RecurringUpdatePayload,
  RecurringWritePayload,
} from "./types";

const BASE = "/recurring-payments";

export const toWritePayload = (
  v: RecurringFormValues,
): RecurringWritePayload => ({
  name: v.name,
  type: v.type,
  amount: v.amount,
  frequency: v.frequency,
  startDate: v.startDate,
  endDate: v.endDate || undefined,
  accountId: v.accountId,
  categoryId: v.categoryId,
});

export const fetchRecurringPayments = (isActive?: boolean) =>
  api<RecurringPayment[]>(
    isActive === undefined ? BASE : `${BASE}?isActive=${isActive}`,
  );

export const createRecurringPayment = (input: RecurringWritePayload) =>
  api<RecurringPayment>(BASE, { method: "POST", body: JSON.stringify(input) });

export const updateRecurringPayment = (
  id: string,
  input: RecurringUpdatePayload,
) =>
  api<RecurringPayment>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const pauseRecurringPayment = (id: string) =>
  api<RecurringPayment>(`${BASE}/${id}/pause`, { method: "PATCH" });

export const resumeRecurringPayment = (id: string) =>
  api<RecurringPayment>(`${BASE}/${id}/resume`, { method: "PATCH" });

export const deleteRecurringPayment = (id: string) =>
  api<null>(`${BASE}/${id}`, { method: "DELETE" });

export const fetchRecurringExecutions = (id: string, page = 1, limit = 20) =>
  api<RecurringExecutionPage>(
    `${BASE}/${id}/executions?page=${page}&limit=${limit}`,
  );
