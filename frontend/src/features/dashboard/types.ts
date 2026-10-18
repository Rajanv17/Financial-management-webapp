export type DashboardCategoryTotal = {
  categoryId: string;
  name: string;
  color: string | null;
  total: number;
  percent: number;
};

export type DashboardMonthlyPoint = {
  month: string;
  income: number;
  expense: number;
};

export type DashboardSummary = {
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  byCategory: DashboardCategoryTotal[];
  monthly: DashboardMonthlyPoint[];
};

export type PeriodId =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year";
