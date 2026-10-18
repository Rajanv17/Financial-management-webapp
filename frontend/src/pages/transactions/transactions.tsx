import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Money,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchCategories } from "@/features/categories/api";
import type { Category } from "@/features/categories/types";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
  type TransactionListParams,
} from "@/features/transactions/api";
import {
  PAYMENT_METHOD_LABELS,
  type Transaction,
  type TransactionWritePayload,
} from "@/features/transactions/types";
import { ApiClientError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { DataTable } from "./data-table";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { createTransactionColumns } from "./transactions-columns";

const PAGE_SIZE = 20;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

const groupedCategories = (categories: Category[]) => ({
  expense: categories.filter((category) => category.type === "expense"),
  income: categories.filter((category) => category.type === "income"),
});

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtersActive =
    debouncedQ !== "" || type !== "all" || categoryId !== "all" || from !== "" || to !== "";

  const listParams: TransactionListParams = {
    page,
    limit: PAGE_SIZE,
    ...(type !== "all" ? { type } : {}),
    ...(categoryId !== "all" ? { categoryId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    sortBy: "date",
    sortOrder: "desc",
  };

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(listParams),
    queryFn: () => fetchTransactions(listParams),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => fetchCategories(false),
  });

  const categories = categoriesQuery.data ?? [];
  const grouped = groupedCategories(
    type === "all" ? categories : categories.filter((category) => category.type === type),
  );

  const invalidateRelated = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);

  const saveMutation = useMutation({
    mutationFn: async (payload: TransactionWritePayload) => {
      if (editing) {
        return updateTransaction(editing.id, payload);
      }
      return createTransaction(payload);
    },
    onSuccess: async () => {
      await invalidateRelated();
      toast.success(editing ? "Transaction updated" : "Transaction added");
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Transaction deleted");
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Could not delete the transaction.",
      );
    },
  });

  const columns = useMemo(
    () =>
      createTransactionColumns({
        onEdit: (transaction) => {
          setEditing(transaction);
          setFormOpen(true);
        },
        onDelete: setDeleting,
      }),
    [],
  );

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedQ("");
    setType("all");
    setCategoryId("all");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const items = transactionsQuery.data?.items ?? [];
  const pagination = transactionsQuery.data?.pagination;
  const isEmpty = !filtersActive && pagination?.total === 0;
  const isNoResults = filtersActive && pagination?.total === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and manage your income and expenses."
        action={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add Transaction
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search transactions"
            className="pl-9"
            aria-label="Search transactions"
          />
        </div>
        <Tabs
          value={type}
          onValueChange={(value) => {
            setType(value as typeof type);
            setCategoryId("all");
            setPage(1);
          }}
          className="shrink-0"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-56" aria-label="Category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {grouped.expense.length > 0 ? (
              <SelectGroup>
                <SelectLabel>Expense</SelectLabel>
                {grouped.expense.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
            {grouped.income.length > 0 ? (
              <SelectGroup>
                <SelectLabel>Income</SelectLabel>
                {grouped.income.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-1">
          <Label htmlFor="from-date" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="to-date" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {filtersActive ? (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {transactionsQuery.isLoading ? <TableSkeleton /> : null}

      {transactionsQuery.isError ? (
        <ErrorState
          message={
            transactionsQuery.error instanceof ApiClientError
              ? transactionsQuery.error.message
              : "Could not load transactions."
          }
          onRetry={() => void transactionsQuery.refetch()}
        />
      ) : null}

      {transactionsQuery.isSuccess && isEmpty ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first transaction"
          action={
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              Add Transaction
            </Button>
          }
        />
      ) : null}

      {transactionsQuery.isSuccess && isNoResults ? (
        <EmptyState
          title="No matching transactions"
          description="Try adjusting your filters to see more results."
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : null}

      {transactionsQuery.isSuccess && items.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((transaction) => (
              <article
                key={transaction.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{transaction.title}</p>
                    {transaction.description ? (
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    ) : null}
                  </div>
                  <Money amount={transaction.amount} type={transaction.type} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="tabular-nums">{formatDate(transaction.date)}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full bg-muted-foreground"
                      style={
                        transaction.category?.color
                          ? { backgroundColor: transaction.category.color }
                          : undefined
                      }
                    />
                    {transaction.category?.name ?? "—"}
                  </span>
                  <span>
                    {transaction.paymentMethod
                      ? PAYMENT_METHOD_LABELS[transaction.paymentMethod]
                      : "—"}
                  </span>
                  <StatusBadge
                    label={transaction.type === "income" ? "Income" : "Expense"}
                    tone={transaction.type}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(transaction);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleting(transaction)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={items} />
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <TransactionFormDialog
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        transaction={editing}
        categories={categories}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete transaction"
        description="This transaction will be permanently deleted."
        pending={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteMutation.mutateAsync(deleting.id);
          }
        }}
      />
    </div>
  );
}
