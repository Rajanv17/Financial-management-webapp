import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  PiggyBank,
  Plus,
  TrendingDown,
  Wallet,
  Copy,
  RotateCcw,
  Archive,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AddBudgetModal } from "@/components/modals/add-budget-modal";
import {
  BudgetProgress,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Money,
  PageHeader,
  StatCard,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  archiveBudget,
  createBudget,
  fetchBudgetSummary,
  fetchBudgets,
  updateBudget,
  restoreBudget,
  copyBudgets,
} from "@/features/budgets/api";
import type {
  BudgetUpdatePayload,
  BudgetWithStats,
  BudgetWritePayload,
} from "@/features/budgets/types";
import { fetchCategories } from "@/features/categories/api";
import { ApiClientError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

type BudgetsTab = "active" | "archived";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentPeriod = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const yearOptions = (selectedYear: number) => {
  const current = new Date().getFullYear();
  const years = new Set<number>();
  for (let year = current - 10; year <= current + 5; year += 1) {
    years.add(year);
  }
  years.add(selectedYear);
  return [...years].sort((a, b) => b - a);
};

const remainingLabel = (remaining: number) => {
  if (remaining < 0) {
    return `Over by ${formatINR(-remaining)}`;
  }
  return formatINR(remaining);
};

const previousPeriod = (month: number, year: number) =>
  month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };

function SpendChange({
  percent,
  delta,
}: {
  percent: number | null;
  delta: number;
}) {
  if (percent === null) {
    return (
      <span className="text-muted-foreground">
        No data
        <span className="block text-sm font-normal">
          No spending last month
        </span>
      </span>
    );
  }
  if (percent === 0) {
    return (
      <span>
        About the same
        <span className="block text-sm font-normal text-muted-foreground">
          as last month
        </span>
      </span>
    );
  }
  const up = percent > 0;
  return (
    <span className={up ? "text-danger" : "text-success"}>
      {up ? "Up" : "Down"} {Math.abs(percent)}%
      <span className="block text-sm font-normal text-muted-foreground">
        <Money amount={Math.abs(delta)} /> {up ? "more" : "less"} than last
        month
      </span>
    </span>
  );
}

function BudgetPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const initial = currentPeriod();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithStats | null>(null);
  const [archiving, setArchiving] = useState<BudgetWithStats | null>(null);
  const [tab, setTab] = useState<BudgetsTab>("active");
  const isArchivedView = tab === "archived";
  const previous = previousPeriod(month, year);

  const previousLabel = `${
    MONTH_OPTIONS.find((item) => item.value === previous.month)?.label ?? ""
  } ${previous.year}`;

  const budgetsQuery = useQuery({
    queryKey: [...queryKeys.budgets.list(month, year), tab],
    queryFn: () => fetchBudgets(month, year, isArchivedView),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.budgets.summary(month, year),
    queryFn: () => fetchBudgetSummary(month, year),
    enabled: !isArchivedView,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => fetchCategories(false),
  });

  const invalidateRelated = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);

  const saveMutation = useMutation({
    mutationFn: async ({
      budget,
      createPayload,
      updatePayload,
    }: {
      budget: BudgetWithStats | null;
      createPayload?: BudgetWritePayload;
      updatePayload?: BudgetUpdatePayload;
    }) => {
      if (budget && updatePayload) {
        return updateBudget(budget.id, updatePayload);
      }
      if (createPayload) {
        return createBudget(createPayload);
      }
      throw new Error("Missing budget payload");
    },
    onSuccess: async (_data, variables) => {
      await invalidateRelated();
      toast.success(variables.budget ? "Budget updated" : "Budget created");
      if (!variables.budget && variables.createPayload) {
        setMonth(variables.createPayload.month);
        setYear(variables.createPayload.year);
      }
      setFormOpen(false);
      setTab("active");
      setEditing(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveBudget(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Budget archived");
      setArchiving(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Could not archive the budget.",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreBudget(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Budget restored");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Could not restore the budget.",
      );
    },
  });

  const copyMutation = useMutation({
    mutationFn: () => copyBudgets(month, year),
    onSuccess: async (result) => {
      await invalidateRelated();
      if (result.created > 0) {
        toast.success(
          `Copied ${result.created} ${result.created === 1 ? "budget" : "budgets"} from ${previousLabel}`,
        );
      } else {
        toast.info(`No new budgets to copy from ${previousLabel}`);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Could not copy budgets.",
      );
    },
  });

  const copyAction = (
    <Button
      type="button"
      variant="outline"
      onClick={() => copyMutation.mutate()}
      disabled={copyMutation.isPending}
    >
      <Copy />
      {copyMutation.isPending ? "Copying…" : `Copy from ${previousLabel}`}
    </Button>
  );

  const budgets = useMemo(() => {
    const items = budgetsQuery.data ?? [];
    return [...items].sort(
      (left, right) => right.percentageUsed - left.percentageUsed,
    );
  }, [budgetsQuery.data]);
  const summary = summaryQuery.data;
  const categories = categoriesQuery.data ?? [];
  const isLoading = budgetsQuery.isLoading || summaryQuery.isLoading;
  const isError = budgetsQuery.isError || summaryQuery.isError;
  const errorMessage =
    budgetsQuery.error instanceof ApiClientError
      ? budgetsQuery.error.message
      : summaryQuery.error instanceof ApiClientError
        ? summaryQuery.error.message
        : "Could not load budgets.";

  const remainingTone =
    summary && summary.remaining < 0 ? "text-danger" : "text-foreground";

  const monthLabel = useMemo(
    () => MONTH_OPTIONS.find((item) => item.value === month)?.label ?? "",
    [month],
  );

  const retry = () => {
    void budgetsQuery.refetch();
    if (!isArchivedView) void summaryQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description="Set spending limits and track how this month is going."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <div className="space-y-1">
                <Label htmlFor="budget-page-month" className="sr-only">
                  Month
                </Label>
                <Select
                  value={String(month)}
                  onValueChange={(value) => setMonth(Number(value))}
                >
                  <SelectTrigger id="budget-page-month" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="budget-page-year" className="sr-only">
                  Year
                </Label>
                <Select
                  value={String(year)}
                  onValueChange={(value) => setYear(Number(value))}
                >
                  <SelectTrigger id="budget-page-year" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions(year).map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              Create budget
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as BudgetsTab)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <BudgetPageSkeleton /> : null}

      {isError && !isLoading ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {!isLoading && !isError && !isArchivedView && summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total budget"
            value={<Money amount={summary.totalBudget} />}
            icon={Wallet}
          />
          <StatCard
            label="Spent"
            value={
              <Money amount={summary.totalSpent} className="text-danger" />
            }
            icon={TrendingDown}
          />
          <StatCard
            label="Remaining"
            value={
              <span className={remainingTone}>
                {remainingLabel(summary.remaining)}
              </span>
            }
            icon={PiggyBank}
          />
          <StatCard
            label="Vs last month"
            value={
              <SpendChange
                percent={summary.spentDeltaPercent}
                delta={summary.spentDelta}
              />
            }
            icon={TrendingUp}
          />
        </div>
      ) : null}

      {!isLoading && !isError && budgets.length === 0 ? (
        <EmptyState
          title={
            isArchivedView ? "No archived budgets" : "Set your first budget"
          }
          description={
            isArchivedView
              ? `Budgets you archive for ${monthLabel} ${year} appear here and can be restored.`
              : `No budgets for ${monthLabel} ${year}. Create a monthly limit for an expense category, or copy last month's budgets.`
          }
          action={
            isArchivedView ? undefined : (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus />
                  Create budget
                </Button>
                {copyAction}
              </div>
            )
          }
        />
      ) : null}

      {!isLoading && !isError && budgets.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>
              {isArchivedView ? "Archived budgets" : "Budget overview"}
            </CardTitle>
            {isArchivedView ? null : copyAction}
          </CardHeader>
          <CardContent className="space-y-6">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="flex flex-col gap-3 border-b border-border pb-6 last:border-b-0 last:pb-0 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full bg-muted-foreground"
                    style={
                      budget.category.color
                        ? { backgroundColor: budget.category.color }
                        : undefined
                    }
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-medium text-foreground">
                        {budget.category.name}
                        {!budget.isActive ? (
                          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                            Paused
                          </span>
                        ) : null}
                      </h2>
                      <div className="flex gap-1">
                        {isArchivedView ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate(budget.id)}
                          >
                            <RotateCcw />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${budget.category.name} budget`}
                              onClick={() => {
                                setEditing(budget);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Archive ${budget.category.name} budget`}
                              onClick={() => setArchiving(budget)}
                            >
                              <Archive />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <BudgetProgress
                      percentageUsed={budget.percentageUsed}
                      status={budget.status}
                    />
                    <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-4">
                      <p className="flex justify-between gap-2 sm:block">
                        <span className="text-muted-foreground">Limit</span>{" "}
                        <span className="tabular-nums text-foreground">
                          <Money amount={budget.amount} />
                        </span>
                      </p>
                      <p className="flex justify-between gap-2 sm:block">
                        <span className="text-muted-foreground">Spent</span>{" "}
                        <span className="tabular-nums">
                          <Money
                            amount={budget.spent}
                            className="text-danger"
                          />
                        </span>
                      </p>
                      <p className="flex justify-between gap-2 sm:block">
                        <span className="text-muted-foreground">Remaining</span>{" "}
                        <span
                          className={
                            budget.remaining < 0
                              ? "tabular-nums text-danger"
                              : "tabular-nums text-foreground"
                          }
                        >
                          {remainingLabel(budget.remaining)}
                        </span>
                      </p>
                      <p className="flex justify-between gap-2 sm:block">
                        <span className="text-muted-foreground">
                          Last month
                        </span>{" "}
                        <span className="tabular-nums text-foreground">
                          <Money amount={budget.previousSpent} />
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {formOpen ? (
        <AddBudgetModal
          open={formOpen}
          budget={editing}
          categories={categories}
          defaultMonth={month}
          defaultYear={year}
          pending={saveMutation.isPending}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          onCreate={async (payload) => {
            await saveMutation.mutateAsync({
              budget: null,
              createPayload: payload,
            });
          }}
          onUpdate={async (payload) => {
            if (!editing) return;
            await saveMutation.mutateAsync({
              budget: editing,
              updatePayload: payload,
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title="Archive this budget?"
        description={
          archiving
            ? `“${archiving.category.name}” will be archived for ${monthLabel} ${year}. You can restore it later from the Archived view.`
            : ""
        }
        confirmLabel="Archive"
        pendingLabel="Archiving…"
        pending={archiveMutation.isPending}
        onConfirm={() => {
          if (archiving) {
            void archiveMutation.mutateAsync(archiving.id);
          }
        }}
      />
    </div>
  );
}
