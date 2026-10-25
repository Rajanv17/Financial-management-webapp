import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
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
import { fetchAccounts } from "@/features/accounts/api";
import { writeLastAccountId } from "@/features/accounts/last-account";
import type { Account } from "@/features/accounts/types";
import { fetchCategories } from "@/features/categories/api";
import type { Category } from "@/features/categories/types";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
  type TransactionListParams,
} from "@/features/transactions/api";
import { invalidateAfterTransactionChange } from "@/features/transactions/invalidate";
import type { Transaction, TransactionWritePayload } from "@/features/transactions/types";
import { ApiClientError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  TransactionFormDialog,
  type TransactionAccountOption,
} from "./transaction-form-dialog";
import { TransactionResults } from "./transaction-results";

const PAGE_SIZE = 20;

const groupedCategories = (categories: Category[]) => ({
  expense: categories.filter((category) => category.type === "expense"),
  income: categories.filter((category) => category.type === "income"),
});

const toAccountOption = (account: Account): TransactionAccountOption => ({
  id: account.id,
  name: account.name,
  isArchived: account.isArchived,
  isDefault: account.isDefault,
});

const formAccountOptions = (
  active: Account[],
  editing: Transaction | null,
): TransactionAccountOption[] => {
  const options = active.map(toAccountOption);
  if (editing && !options.some((account) => account.id === editing.accountId)) {
    options.push({
      id: editing.accountId,
      name: editing.account?.name ?? "Archived account",
      isArchived: true,
      isDefault: false,
    });
  }
  return options;
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [accountId, setAccountId] = useState("all");
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
    debouncedQ !== "" ||
    type !== "all" ||
    categoryId !== "all" ||
    accountId !== "all" ||
    from !== "" ||
    to !== "";

  const listParams: TransactionListParams = {
    page,
    limit: PAGE_SIZE,
    ...(type !== "all" ? { type } : {}),
    ...(categoryId !== "all" ? { categoryId } : {}),
    ...(accountId !== "all" ? { accountId } : {}),
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

  const activeAccountsQuery = useQuery({
    queryKey: queryKeys.accounts.list(false),
    queryFn: () => fetchAccounts(false),
  });

  const activeAccounts = activeAccountsQuery.data ?? [];
  const filterNeedsArchived =
    accountId !== "all" &&
    !(activeAccountsQuery.data ?? []).some((account) => account.id === accountId);

  const archivedAccountsQuery = useQuery({
    queryKey: queryKeys.accounts.list(true),
    queryFn: () => fetchAccounts(true),
    enabled: filterNeedsArchived,
  });

  const categories = categoriesQuery.data ?? [];
  const grouped = groupedCategories(
    type === "all" ? categories : categories.filter((category) => category.type === type),
  );

  const filterAccounts = useMemo(() => {
    const active = activeAccountsQuery.data ?? [];
    const options = active.map(toAccountOption);
    if (
      accountId !== "all" &&
      !active.some((account) => account.id === accountId)
    ) {
      const archived = (archivedAccountsQuery.data ?? []).find(
        (account) => account.id === accountId,
      );
      if (archived) {
        options.push(toAccountOption(archived));
      }
    }
    return options;
  }, [accountId, activeAccountsQuery.data, archivedAccountsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: TransactionWritePayload) => {
      if (editing) {
        const { accountId: nextAccountId, ...rest } = payload;
        return updateTransaction(editing.id, {
          ...rest,
          ...(nextAccountId !== editing.accountId
            ? { accountId: nextAccountId }
            : {}),
        });
      }
      return createTransaction(payload);
    },
    onSuccess: async (_data, payload) => {
      if (!editing) {
        writeLastAccountId(payload.accountId);
      }
      await invalidateAfterTransactionChange(queryClient);
      toast.success(editing ? "Transaction updated" : "Transaction added");
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: async () => {
      await invalidateAfterTransactionChange(queryClient);
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

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedQ("");
    setType("all");
    setCategoryId("all");
    setAccountId("all");
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
            Add transaction
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
        <Select
          value={accountId}
          onValueChange={(value) => {
            setAccountId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-56" aria-label="Account">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {filterAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.isArchived ? `${account.name} (archived)` : account.name}
              </SelectItem>
            ))}
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
              Add transaction
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
        <TransactionResults
          items={items}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={(transaction) => {
            setEditing(transaction);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
        />
      ) : null}

      <TransactionFormDialog
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        transaction={editing}
        categories={categories}
        accounts={formAccountOptions(activeAccounts, editing)}
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
