import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountAmount } from "@/features/accounts/account-amount";
import { fetchAccount, fetchAccounts } from "@/features/accounts/api";
import { writeLastAccountId } from "@/features/accounts/last-account";
import { ACCOUNT_TYPE_LABELS, type Account } from "@/features/accounts/types";
import { fetchCategories } from "@/features/categories/api";
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
} from "@/pages/transactions/transaction-form-dialog";
import { TransactionResults } from "@/pages/transactions/transaction-results";

const PAGE_SIZE = 20;

const queryErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

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

function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>
      <TableSkeleton />
    </div>
  );
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const accountQuery = useQuery({
    queryKey: queryKeys.accounts.detail(id ?? ""),
    queryFn: () => fetchAccount(id!),
    enabled: !!id,
  });

  const listParams: TransactionListParams = {
    page,
    limit: PAGE_SIZE,
    ...(id ? { accountId: id } : {}),
    sortBy: "date",
    sortOrder: "desc",
  };

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(listParams),
    queryFn: () => fetchTransactions(listParams),
    enabled: !!id && accountQuery.isSuccess,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => fetchCategories(false),
  });

  const activeAccountsQuery = useQuery({
    queryKey: queryKeys.accounts.list(false),
    queryFn: () => fetchAccounts(false),
  });

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
    mutationFn: (transactionId: string) => deleteTransaction(transactionId),
    onSuccess: async () => {
      await invalidateAfterTransactionChange(queryClient);
      toast.success("Transaction deleted");
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(queryErrorMessage(error, "Could not delete the transaction."));
    },
  });

  const account = accountQuery.data;
  const categories = categoriesQuery.data ?? [];
  const activeAccounts = activeAccountsQuery.data ?? [];
  const items = transactionsQuery.data?.items ?? [];
  const pagination = transactionsQuery.data?.pagination;
  const isEmpty = pagination?.total === 0;
  const notFound =
    accountQuery.isError &&
    accountQuery.error instanceof ApiClientError &&
    accountQuery.error.statusCode === 404;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  if (!id || notFound) {
    return (
      <EmptyState
        title="Account not found"
        description="This account does not exist, or you do not have access to it."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/accounts">Back to accounts</Link>
          </Button>
        }
      />
    );
  }

  if (accountQuery.isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (accountQuery.isError) {
    return (
      <ErrorState
        message={queryErrorMessage(accountQuery.error, "Could not load this account.")}
        onRetry={() => void accountQuery.refetch()}
      />
    );
  }

  if (!account) return null;

  const description = [account.institutionName, account.isArchived ? "Archived" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to="/dashboard/accounts">
            <ArrowLeft />
            Accounts
          </Link>
        </Button>
        <PageHeader
          title={account.name}
          description={description || "Account transactions"}
          badge={
            <>
              <StatusBadge
                label={ACCOUNT_TYPE_LABELS[account.type]}
                tone="neutral"
              />
              {account.isDefault ? <Badge variant="secondary">Default</Badge> : null}
            </>
          }
          action={
            <Button type="button" onClick={openCreate}>
              <Plus />
              Add transaction
            </Button>
          }
        />
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          <AccountAmount
            amount={account.balance}
            isCreditCard={account.type === "credit_card"}
          />
        </p>
      </div>

      {transactionsQuery.isLoading ? <TableSkeleton /> : null}

      {transactionsQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(
            transactionsQuery.error,
            "Could not load transactions.",
          )}
          onRetry={() => void transactionsQuery.refetch()}
        />
      ) : null}

      {transactionsQuery.isSuccess && isEmpty ? (
        <EmptyState
          title="No transactions yet"
          description="Transactions for this account will appear here."
          action={
            <Button type="button" onClick={openCreate}>
              <Plus />
              Add transaction
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
