import { useState } from "react";
import { Calendar, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  Money,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteRecurring,
  usePauseRecurring,
  useRecurringPayments,
  useResumeRecurring,
} from "@/features/recurring/hooks";
import {
  FREQUENCY_LABELS,
  type RecurringPayment,
} from "@/features/recurring/types";

type Filter = "active" | "paused";

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

// Inactive and past its end date: the worker deactivated it, it cannot be resumed.
const hasEnded = (p: RecurringPayment) =>
  !p.isActive && p.endDate !== null && p.nextDueDate > p.endDate;

function ListSkeleton() {
  return (
    <ul
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading recurring payments"
    >
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </ul>
  );
}

export default function RecurringPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [removing, setRemoving] = useState<RecurringPayment | null>(null);

  const query = useRecurringPayments();
  const pause = usePauseRecurring();
  const resume = useResumeRecurring();
  const remove = useDeleteRecurring();
  const busy = pause.isPending || resume.isPending || remove.isPending;

  const payments = (query.data ?? []).filter((p) =>
    filter === "active" ? p.isActive : !p.isActive,
  );

  const handlePause = (p: RecurringPayment) =>
    pause.mutate(p.id, {
      onSuccess: () => toast.success(`${p.name} paused`),
      onError: (e) => toast.error(errorMessage(e)),
    });

  const handleResume = (p: RecurringPayment) =>
    resume.mutate(p.id, {
      onSuccess: () => toast.success(`${p.name} resumed`),
      onError: (e) => toast.error(errorMessage(e)),
    });

  const renderBody = () => {
    if (query.isPending) return <ListSkeleton />;

    if (query.isError) {
      return (
        <EmptyState
          title="Could not load recurring payments"
          description={errorMessage(query.error)}
          action={
            <Button type="button" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (payments.length === 0) {
      return filter === "active" ? (
        <EmptyState
          title="No active recurring payments"
          description="Rent, subscriptions and EMIs you add will show up here and create transactions automatically."
        />
      ) : (
        <EmptyState
          title="Nothing paused or ended"
          description="Paused and ended payments appear here."
        />
      );
    }

    return (
      <ul className="space-y-3">
        {payments.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.isActive
                        ? `Next due ${formatDate(p.nextDueDate)}`
                        : hasEnded(p)
                          ? `Ended ${p.endDate ? formatDate(p.endDate) : ""}`
                          : "Paused"}{" "}
                      · {FREQUENCY_LABELS[p.frequency]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={p.category.name} />
                      <StatusBadge label={p.account.name} />
                      {!p.isActive ? (
                        <StatusBadge
                          label={hasEnded(p) ? "Ended" : "Paused"}
                          tone="warning"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <Money
                    amount={p.amount}
                    type={p.type}
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-1">
                    {p.isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Pause ${p.name}`}
                        disabled={busy}
                        onClick={() => handlePause(p)}
                      >
                        <Pause />
                      </Button>
                    ) : !hasEnded(p) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Resume ${p.name}`}
                        disabled={busy}
                        onClick={() => handleResume(p)}
                      >
                        <Play />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${p.name}`}
                      disabled={busy}
                      onClick={() => setRemoving(p)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring payments"
        description="Bills, subscriptions and income that repeat. Transactions are created automatically on the due date."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused / ended</TabsTrigger>
        </TabsList>
      </Tabs>

      {renderBody()}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Delete this recurring payment?"
        description="Future transactions will stop. Transactions it already created stay in your history."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => toast.success(`${removing.name} deleted`),
            onError: (e) => toast.error(errorMessage(e)),
          });
          setRemoving(null);
        }}
      />
    </div>
  );
}
