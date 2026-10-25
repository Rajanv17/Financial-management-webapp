import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Landmark, Pencil, Plus, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatINRString, isNegativeMoneyString } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

type AccountsTab = "active" | "archived";

const queryErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

const unsignedMoneyString = (amount: string) =>
  amount.trim().startsWith("-") ? amount.trim().slice(1) : amount.trim();

function AccountAmount({
  amount,
  isCreditCard,
}: {
  amount: string;
  isCreditCard: boolean;
}) {
  const negative = isNegativeMoneyString(amount);
  const formatted = formatINRString(negative ? unsignedMoneyString(amount) : amount);
  const owed = isCreditCard && negative;

  return (
    <span
      className={
        negative ? "tabular-nums text-danger" : "tabular-nums text-foreground"
      }
    >
      {owed ? `${formatted} owed` : negative ? `−${formatted}` : formatted}
    </span>
  );
}

function AccountsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={index}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28" />
          </article>
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
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
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
          size="icon"
          aria-label={`Archive ${account.name}`}
          onClick={() => setArchiving(account)}
        >
          <Archive />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Net balance"
            value={
              <AccountAmount
                amount={summary.netBalance}
                isCreditCard={false}
              />
            }
            icon={Wallet}
          />
          <StatCard
            label="Accounts"
            value={summary.accountCount}
            icon={Landmark}
          />
          {summary.byType.map((item) => (
            <StatCard
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
        <div className="grid gap-3">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-foreground">{account.name}</h2>
                    {account.isDefault ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={ACCOUNT_TYPE_LABELS[account.type]}
                      tone="neutral"
                    />
                    {account.institutionName ? (
                      <span className="text-sm text-muted-foreground">
                        {account.institutionName}
                      </span>
                    ) : null}
                  </div>
                </div>
                {renderActions(account)}
              </div>
              <p className="text-lg font-semibold tracking-tight">
                <AccountAmount
                  amount={account.balance}
                  isCreditCard={account.type === "credit_card"}
                />
              </p>
            </article>
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
        pending={archiveMutation.isPending}
        onConfirm={async () => {
          if (archiving) {
            await archiveMutation.mutateAsync(archiving.id);
          }
        }}
      />
    </div>
  );
}
