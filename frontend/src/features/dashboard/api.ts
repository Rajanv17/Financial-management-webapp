import { api } from "@/lib/api";
import type { DashboardSummary } from "./types";

export const fetchDashboardSummary = (from: string, to: string) =>
  api<DashboardSummary>(`/dashboard/summary?from=${from}&to=${to}`);
