import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountAmount } from "@/features/accounts/account-amount";
import { AccountCard } from "@/features/accounts/account-card";
import { AccountFormDialog } from "@/features/accounts/account-form-dialog";
import {
  archiveAccount,
  createAccount,
  fetchAccountSummary,
  fetchAccounts,
  restoreAccount,
  updateAccount,
} from "@/features/accounts/api";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountWritePayload,
} from "@/features/accounts/types";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";

type AccountsTab = "active" | "archived";

const queryErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

function SummaryTile({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: ReactNode;
  prominent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        prominent ? "px-4 py-3" : "px-3 py-2.5",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "mt-1 font-semibold tracking-tight",
          prominent ? "text-2xl" : "text-base",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AccountsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[7.5rem] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AccountsTab>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [archiving, setArchiving] = useState<Account | null>(null);

  const archived = tab === "archived";

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.list(archived),
    queryFn: () => fetchAccounts(archived),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.accounts.summary,
    queryFn: fetchAccountSummary,
  });

  const invalidateRelated = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });

  const saveMutation = useMutation({
    mutationFn: async (payload: AccountWritePayload) => {
      if (editing) {
        return updateAccount(editing.id, payload);
      }
      return createAccount(payload);
    },
    onSuccess: async () => {
      await invalidateRelated();
      toast.success(editing ? "Account updated" : "Account created");
      setFormOpen(false);
      setEditing(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveAccount(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Account archived");
      setArchiving(null);
    },
    onError: (error) => {
      toast.error(queryErrorMessage(error, "Could not archive the account."));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreAccount(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Account restored");
    },
    onError: (error) => {
      toast.error(queryErrorMessage(error, "Could not restore the account."));
    },
  });

  const accounts = accountsQuery.data ?? [];
  const summary = summaryQuery.data;
  const isLoading = accountsQuery.isLoading || summaryQuery.isLoading;
  const isError = accountsQuery.isError || summaryQuery.isError;
  const errorMessage = accountsQuery.isError
    ? queryErrorMessage(accountsQuery.error, "Could not load accounts.")
    : queryErrorMessage(summaryQuery.error, "Could not load accounts.");

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const renderAddButton = () => (
    <Button type="button" onClick={openCreate}>
      <Plus />
      Add account
    </Button>
  );

  const renderActions = (account: Account) => {
    if (account.isDefault) return null;

    if (archived) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={restoreMutation.isPending}
          aria-label={`Restore ${account.name}`}
          onClick={() => restoreMutation.mutate(account.id)}
        >
          <RotateCcw />
          Restore
        </Button>
      );
    }

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${account.name}`}
          onClick={() => {
            setEditing(account);
            setFormOpen(true);
          }}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Archive ${account.name}`}
          onClick={() => setArchiving(account)}
        >
          <Archive />
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accounts"
        description="Track balances across bank, cash, wallet, and credit accounts."
        action={renderAddButton()}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as AccountsTab)}
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <AccountsPageSkeleton /> : null}

      {isError && !isLoading ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void accountsQuery.refetch();
            void summaryQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && summary ? (
        <div className="space-y-3">
          <SummaryTile
            prominent
            label="Net balance"
            value={
              <AccountAmount
                amount={summary.netBalance}
                isCreditCard={false}
              />
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <SummaryTile label="Accounts" value={summary.accountCount} />
            {summary.byType.map((item) => (
              <SummaryTile
                key={item.type}
                label={`${ACCOUNT_TYPE_LABELS[item.type]} total`}
                value={
                  <AccountAmount
                    amount={item.total}
                    isCreditCard={item.type === "credit_card"}
                  />
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && accounts.length === 0 ? (
        <EmptyState
          title={archived ? "No archived accounts" : "No accounts yet"}
          description={
            archived
              ? "Archived accounts will appear here. You can restore them at any time."
              : "Add a bank, cash, wallet, or credit card account. New users start with a default Unassigned account that cannot be edited or archived."
          }
          action={archived ? undefined : renderAddButton()}
        />
      ) : null}

      {!isLoading && !isError && accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              actions={renderActions(account)}
            />
          ))}
        </div>
      ) : null}

      <AccountFormDialog
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        account={editing}
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
        open={!!archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title="Archive account"
        description={
          archiving
            ? `“${archiving.name}” will be hidden from new transactions. Existing history is kept, and you can restore it later.`
            : ""
        }
        confirmLabel="Archive"
        pendingLabel="Archiving…"
        onConfirm={async () => {
          if (archiving) {
            await archiveMutation.mutateAsync(archiving.id);
          }
        }}
        pending={archiveMutation.isPending}
      />
    </div>
  );
}
