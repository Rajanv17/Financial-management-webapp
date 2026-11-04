import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ErrorState, StatusBadge } from "@/components/shared";
import { formatDate } from "./format";
import { useRecurringExecutions } from "./hooks";
import type { RecurringExecution, RecurringPayment } from "./types";

type Props = {
  payment: RecurringPayment | null;
  onClose: () => void;
};

const formatProcessed = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

function ExecutionRow({ item }: { item: RecurringExecution }) {
  const created = item.status === "created";
  return (
    <li className="space-y-1 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">
          {formatDate(item.scheduledFor)}
        </span>
        <StatusBadge
          label={created ? "Transaction created" : "Skipped"}
          tone={created ? "income" : "warning"}
        />
      </div>
      {item.reason ? (
        <p className="text-sm text-muted-foreground">{item.reason}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Processed {formatProcessed(item.executedAt)}
      </p>
    </li>
  );
}

export function RecurringHistorySheet({ payment, onClose }: Props) {
  // The parent keys this component by payment id, so the page resets per payment.
  const [page, setPage] = useState(1);
  const query = useRecurringExecutions(payment?.id ?? null, page);

  const renderBody = () => {
    if (query.isPending) {
      return (
        <ul className="space-y-3" aria-busy="true" aria-label="Loading history">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </ul>
      );
    }

    if (query.isError) {
      return (
        <ErrorState
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
          className="py-10"
        />
      );
    }

    const { items, pagination } = query.data;

    if (items.length === 0) {
      return (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No runs yet.{" "}
          {payment?.isActive
            ? `The first one is scheduled for ${formatDate(payment.nextDueDate)}.`
            : "This payment is not active."}
        </p>
      );
    }

    return (
      <>
        <ul className="space-y-3">
          {items.map((item) => (
            <ExecutionRow key={item.id} item={item} />
          ))}
        </ul>

        {pagination.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <Sheet open={payment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{payment?.name ?? "History"}</SheetTitle>
          <SheetDescription>
            Every time the daily job processed this payment.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{renderBody()}</div>
      </SheetContent>
    </Sheet>
  );
}
