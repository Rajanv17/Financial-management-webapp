import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  PiggyBank,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AddBudgetModal } from "@/components/modals/add-budget-modal";
import {
  BudgetProgress,
  EmptyState,
  ErrorState,
  Money,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { createBudget, fetchBudgetSummary, fetchBudgets } from "@/features/budgets/api";
import type { BudgetWritePayload } from "@/features/budgets/types";
import { AccountAmount } from "@/features/accounts/account-amount";
import { fetchAccountSummary, fetchAccounts } from "@/features/accounts/api";
import { writeLastAccountId } from "@/features/accounts/last-account";
import { fetchCategories } from "@/features/categories/api";
import { fetchDashboardSummary } from "@/features/dashboard/api";
import {
  currentBudgetPeriod,
  PERIOD_OPTIONS,
  periodRange,
} from "@/features/dashboard/period";
import type { PeriodId } from "@/features/dashboard/types";
import { invalidateAfterTransactionChange } from "@/features/transactions/invalidate";
import { createTransaction, fetchTransactions } from "@/features/transactions/api";
import type { TransactionWritePayload } from "@/features/transactions/types";
import { TransactionFormDialog } from "@/pages/transactions/transaction-form-dialog";
import { ApiClientError } from "@/lib/api";
import { formatINR, isNegativeMoneyString } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

const CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const axisAmount = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const greetingForHour = (hour: number) => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatMonthTick = (month: string) => {
  const [year, monthPart] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(monthPart) - 1, 1));
  const parts = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const monthLabel = parts.find((part) => part.type === "month")?.value ?? "";
  const yearLabel = parts.find((part) => part.type === "year")?.value ?? "";
  return `${monthLabel} ${yearLabel}`.trim();
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

const formatShare = (percent: number) => (percent < 1 ? "<1%" : `${percent}%`);

const remainingLabel = (remaining: number) => {
  if (remaining < 0) {
    return `Over by ${formatINR(-remaining)}`;
  }
  return `Remaining ${formatINR(remaining)}`;
};

/** One native rounded rect. Recharts `radius` draws elliptical arcs on a `<path>` that
 * also has `x`/`y`/`width`/`height`, which paints a 1px horizontal seam near the top. */
function roundedTopBar(props: unknown) {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
  };
  if (width <= 0 || height <= 0) {
    return <rect x={0} y={0} width={0} height={0} fill="none" />;
  }
  const r = Math.min(4, width / 2, height / 2);
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={r}
      ry={r}
      fill={fill}
      stroke="none"
    />
  );
}

const queryErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
};

type TooltipRow = {
  name?: string;
  value?: number;
  color?: string;
};

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-4 tabular-nums text-muted-foreground"
          >
            <span>{item.name}</span>
            <span className="text-foreground">
              {typeof item.value === "number" ? formatINR(item.value) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = usePrefersReducedMotion();
  const budgetPeriod = useMemo(() => currentBudgetPeriod(), []);
  const [period, setPeriod] = useState<PeriodId>("this_month");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const range = useMemo(() => periodRange(period), [period]);
  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.id === period)?.label ?? "This month";
  const greeting = `${greetingForHour(new Date().getHours())}, ${user?.username ?? ""}`;

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary(range.from, range.to),
    queryFn: () => fetchDashboardSummary(range.from, range.to),
  });

  const budgetSummaryQuery = useQuery({
    queryKey: queryKeys.budgets.summary(budgetPeriod.month, budgetPeriod.year),
    queryFn: () => fetchBudgetSummary(budgetPeriod.month, budgetPeriod.year),
  });

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets.list(budgetPeriod.month, budgetPeriod.year),
    queryFn: () => fetchBudgets(budgetPeriod.month, budgetPeriod.year),
  });

  const recentQuery = useQuery({
    queryKey: queryKeys.transactions.list({ limit: 5, sortBy: "date", sortOrder: "desc" }),
    queryFn: () =>
      fetchTransactions({ limit: 5, sortBy: "date", sortOrder: "desc" }),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => fetchCategories(false),
  });

  const activeAccountsQuery = useQuery({
    queryKey: queryKeys.accounts.list(false),
    queryFn: () => fetchAccounts(false),
  });

  const accountSummaryQuery = useQuery({
    queryKey: queryKeys.accounts.summary,
    queryFn: fetchAccountSummary,
  });

  const createTransactionMutation = useMutation({
    mutationFn: (payload: TransactionWritePayload) => createTransaction(payload),
    onSuccess: async (_data, payload) => {
      writeLastAccountId(payload.accountId);
      await invalidateAfterTransactionChange(queryClient);
      toast.success("Transaction added");
      setTransactionOpen(false);
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: (payload: BudgetWritePayload) => createBudget(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      ]);
      toast.success("Budget created");
      setBudgetOpen(false);
    },
  });

  const summary = summaryQuery.data;
  const recent = recentQuery.data;
  const categories = categoriesQuery.data ?? [];
  const activeAccounts = activeAccountsQuery.data ?? [];
  const isNewUser = recentQuery.isSuccess && recent?.pagination.total === 0;

  const monthlyChart = useMemo(
    () =>
      (summary?.monthly ?? []).map((point) => ({
        ...point,
        label: formatMonthTick(point.month),
      })),
    [summary],
  );

  const categoryChart = useMemo(
    () =>
      (summary?.byCategory ?? []).map((item, index) => ({
        ...item,
        fill: item.color || CHART_FILLS[index % CHART_FILLS.length],
        displayName: item.name.trim() === "" ? "Unnamed category" : item.name,
      })),
    [summary],
  );

  const hasCashFlow = monthlyChart.some(
    (point) => point.income !== 0 || point.expense !== 0,
  );

  const topBudgets = useMemo(() => {
    const budgets = budgetsQuery.data ?? [];
    return [...budgets]
      .sort((left, right) => right.percentageUsed - left.percentageUsed)
      .slice(0, 3);
  }, [budgetsQuery.data]);

  const openAddTransaction = () => setTransactionOpen(true);
  const openSetBudget = () => setBudgetOpen(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description={`Your financial overview for ${periodLabel.toLowerCase()}.`}
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Label htmlFor="overview-period" className="sr-only">
                Period
              </Label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as PeriodId)}
              >
                <SelectTrigger id="overview-period" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={openAddTransaction}>
              <Plus />
              Add transaction
            </Button>
          </div>
        }
      />

      {recentQuery.isLoading && !recent ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <PanelSkeleton rows={6} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <PanelSkeleton rows={6} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {isNewUser ? (
        <EmptyState
          title="Add your first transaction"
          description="Once you record income and expenses, this page will show totals, trends, and budget health. Nothing here is estimated."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" onClick={openAddTransaction}>
                <Plus />
                Add transaction
              </Button>
              <Button type="button" variant="outline" onClick={openSetBudget}>
                <PiggyBank />
                Set budget
              </Button>
            </div>
          }
        />
      ) : null}

      {!isNewUser && !(recentQuery.isLoading && !recent) ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryQuery.isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : null}

            {summaryQuery.isError && !summaryQuery.isLoading ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <ErrorState
                  className="py-10"
                  message={queryErrorMessage(
                    summaryQuery.error,
                    "Could not load the period summary.",
                  )}
                  onRetry={() => void summaryQuery.refetch()}
                />
              </div>
            ) : null}

            {summary && !summaryQuery.isLoading && !summaryQuery.isError ? (
              <>
                <StatCard
                  label="Income"
                  value={
                    <Money amount={summary.totals.income} className="text-success" />
                  }
                  description={periodLabel}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Expenses"
                  value={
                    <Money amount={summary.totals.expense} className="text-danger" />
                  }
                  description={periodLabel}
                  icon={TrendingDown}
                />
                <StatCard
                  label="Net for period"
                  value={<Money amount={summary.totals.net} />}
                  description="Income minus expenses"
                  icon={ArrowUpDown}
                />
              </>
            ) : null}

            {accountSummaryQuery.isLoading ? <StatCardSkeleton /> : null}

            {accountSummaryQuery.isError && !accountSummaryQuery.isLoading ? (
              <ErrorState
                className="py-10"
                message={queryErrorMessage(
                  accountSummaryQuery.error,
                  "Could not load total balance.",
                )}
                onRetry={() => void accountSummaryQuery.refetch()}
              />
            ) : null}

            {accountSummaryQuery.data &&
            !accountSummaryQuery.isLoading &&
            !accountSummaryQuery.isError ? (
              <StatCard
                label={
                  <span className="flex flex-wrap items-center gap-2">
                    Total balance
                    {isNegativeMoneyString(
                      accountSummaryQuery.data.netBalance,
                    ) ? (
                      <StatusBadge label="Net negative" tone="danger" />
                    ) : null}
                  </span>
                }
                value={
                  <AccountAmount
                    amount={accountSummaryQuery.data.netBalance}
                    isCreditCard={false}
                  />
                }
                description={
                  <Link
                    to="/dashboard/accounts"
                    className="underline-offset-4 hover:underline"
                  >
                    Across all accounts ·{" "}
                    {accountSummaryQuery.data.accountCount}{" "}
                    {accountSummaryQuery.data.accountCount === 1
                      ? "account"
                      : "accounts"}
                  </Link>
                }
                icon={Wallet}
              />
            ) : null}

            {budgetSummaryQuery.isLoading ? <StatCardSkeleton /> : null}

            {budgetSummaryQuery.isError && !budgetSummaryQuery.isLoading ? (
              <ErrorState
                className="py-10"
                message={queryErrorMessage(
                  budgetSummaryQuery.error,
                  "Could not load budget remaining.",
                )}
                onRetry={() => void budgetSummaryQuery.refetch()}
              />
            ) : null}

            {budgetSummaryQuery.data &&
            !budgetSummaryQuery.isLoading &&
            !budgetSummaryQuery.isError ? (
              <StatCard
                label="Budget left this month"
                value={<Money amount={budgetSummaryQuery.data.remaining} />}
                description="Current month"
                icon={PiggyBank}
              />
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income vs expenses</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? <PanelSkeleton rows={6} /> : null}
                {summaryQuery.isError && !summaryQuery.isLoading ? (
                  <ErrorState
                    className="border-0 bg-transparent py-8 shadow-none"
                    message={queryErrorMessage(
                      summaryQuery.error,
                      "Could not load the income and expense chart.",
                    )}
                    onRetry={() => void summaryQuery.refetch()}
                  />
                ) : null}
                {summary && !hasCashFlow ? (
                  <EmptyState
                    className="border-0 bg-transparent py-8 shadow-none"
                    title="No cash flow yet"
                    description="Transactions in this period will appear here as income and expenses."
                  />
                ) : null}
                {summary && hasCashFlow ? (
                  <>
                    <div className="h-72" aria-hidden="true">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChart} barGap={4}>
                          <CartesianGrid stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--border)" }}
                          />
                          <YAxis
                            tickFormatter={(value: number) => axisAmount.format(value)}
                            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--border)" }}
                            width={64}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--muted)" }}
                            content={<MoneyTooltip />}
                          />
                          <Legend
                            formatter={(value) => (
                              <span className="text-sm text-foreground">{value}</span>
                            )}
                          />
                          <Bar
                            dataKey="income"
                            name="Income"
                            fill="var(--success)"
                            shape={roundedTopBar}
                            isAnimationActive={!reduceMotion}
                          />
                          <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="var(--danger)"
                            shape={roundedTopBar}
                            isAnimationActive={!reduceMotion}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <table className="sr-only">
                      <caption>Income versus expenses by month</caption>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Income</th>
                          <th>Expense</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyChart.map((point) => (
                          <tr key={point.month}>
                            <td>{point.label}</td>
                            <td>{formatINR(point.income)}</td>
                            <td>{formatINR(point.expense)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? <PanelSkeleton rows={6} /> : null}
                {summaryQuery.isError && !summaryQuery.isLoading ? (
                  <ErrorState
                    className="border-0 bg-transparent py-8 shadow-none"
                    message={queryErrorMessage(
                      summaryQuery.error,
                      "Could not load spending by category.",
                    )}
                    onRetry={() => void summaryQuery.refetch()}
                  />
                ) : null}
                {summary && categoryChart.length === 0 ? (
                  <EmptyState
                    className="border-0 bg-transparent py-8 shadow-none"
                    title="No spending in this period"
                    description="Expense transactions will show up here by category, with amounts and percentages from the server."
                  />
                ) : null}
                {summary && categoryChart.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                    <div className="relative h-64" aria-hidden="true">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChart}
                            dataKey="total"
                            nameKey="displayName"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={2}
                            isAnimationActive={!reduceMotion}
                          >
                            {categoryChart.map((entry) => (
                              <Cell key={entry.categoryId} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<MoneyTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatINR(summary.totals.expense)}
                        </p>
                      </div>
                    </div>
                    <ul className="min-w-0 space-y-2">
                      {categoryChart.map((item) => (
                        <li
                          key={item.categoryId}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm"
                        >
                          <span className="flex min-w-0 items-start gap-2">
                            <span
                              className="mt-1.5 size-2.5 shrink-0 rounded-full bg-chart-1"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span
                              className="line-clamp-2 min-w-0 text-foreground"
                              title={item.displayName}
                            >
                              {item.displayName}
                            </span>
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatINR(item.total)} · {formatShare(item.percent)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <table className="sr-only">
                      <caption>Spending by category</caption>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Percent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryChart.map((item) => (
                          <tr key={item.categoryId}>
                            <td>{item.displayName}</td>
                            <td>{formatINR(item.total)}</td>
                            <td>{formatShare(item.percent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Recent transactions</CardTitle>
                <CardDescription>Latest five, newest first</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard/transactions">View all</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {recentQuery.isLoading ? <PanelSkeleton /> : null}
                {recentQuery.isError && !recentQuery.isLoading ? (
                  <ErrorState
                    className="border-0 bg-transparent py-8 shadow-none"
                    message={queryErrorMessage(
                      recentQuery.error,
                      "Could not load recent transactions.",
                    )}
                    onRetry={() => void recentQuery.refetch()}
                  />
                ) : null}
                {recent && recent.items.length === 0 ? (
                  <EmptyState
                    className="border-0 bg-transparent py-8 shadow-none"
                    title="No transactions yet"
                    description="Add a transaction to start tracking income and expenses."
                    action={
                      <Button type="button" onClick={openAddTransaction}>
                        <Plus />
                        Add transaction
                      </Button>
                    }
                  />
                ) : null}
                {recent && recent.items.length > 0 ? (
                  <ul className="space-y-4">
                    {recent.items.map((transaction) => (
                      <li
                        key={transaction.id}
                        className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {transaction.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                            {transaction.category?.name
                              ? ` · ${transaction.category.name}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Money
                            amount={transaction.amount}
                            type={transaction.type}
                            className="font-semibold"
                          />
                          <StatusBadge
                            label={transaction.type === "income" ? "Income" : "Expense"}
                            tone={transaction.type === "income" ? "income" : "expense"}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget health</CardTitle>
                <CardDescription>Current month, highest usage first</CardDescription>
              </CardHeader>
              <CardContent>
                {budgetsQuery.isLoading ? <PanelSkeleton /> : null}
                {budgetsQuery.isError && !budgetsQuery.isLoading ? (
                  <ErrorState
                    className="border-0 bg-transparent py-8 shadow-none"
                    message={queryErrorMessage(
                      budgetsQuery.error,
                      "Could not load budget health.",
                    )}
                    onRetry={() => void budgetsQuery.refetch()}
                  />
                ) : null}
                {budgetsQuery.isSuccess && topBudgets.length === 0 ? (
                  <EmptyState
                    className="border-0 bg-transparent py-8 shadow-none"
                    title="No budgets this month"
                    description="Set a monthly limit for an expense category to track spending against it."
                    action={
                      <Button type="button" variant="outline" onClick={openSetBudget}>
                        <PiggyBank />
                        Set budget
                      </Button>
                    }
                  />
                ) : null}
                {topBudgets.length > 0 ? (
                  <ul className="space-y-5">
                    {topBudgets.map((budget) => (
                      <li key={budget.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">
                            {budget.category.name}
                          </p>
                          <p
                            className={
                              budget.remaining < 0
                                ? "text-sm tabular-nums text-danger"
                                : "text-sm tabular-nums text-muted-foreground"
                            }
                          >
                            {remainingLabel(budget.remaining)}
                          </p>
                        </div>
                        <BudgetProgress
                          percentageUsed={budget.percentageUsed}
                          status={budget.status}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Record a transaction or a monthly budget</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button type="button" onClick={openAddTransaction}>
                  <Receipt />
                  Add transaction
                </Button>
                <Button type="button" variant="outline" onClick={openSetBudget}>
                  <PiggyBank />
                  Set budget
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <TransactionFormDialog
        open={transactionOpen}
        transaction={null}
        categories={categories}
        accounts={activeAccounts}
        pending={createTransactionMutation.isPending}
        onOpenChange={setTransactionOpen}
        onSubmit={async (payload) => {
          await createTransactionMutation.mutateAsync(payload);
        }}
      />

      <AddBudgetModal
        open={budgetOpen}
        budget={null}
        categories={categories}
        defaultMonth={budgetPeriod.month}
        defaultYear={budgetPeriod.year}
        pending={createBudgetMutation.isPending}
        onOpenChange={setBudgetOpen}
        onCreate={async (payload) => {
          await createBudgetMutation.mutateAsync(payload);
        }}
        onUpdate={async () => undefined}
      />
    </div>
  );
}
