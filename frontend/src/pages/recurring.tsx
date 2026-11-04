import { useState } from "react";
import { CalendarClock, Pause, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/features/recurring/format";
import {
  useDeleteRecurring,
  usePauseRecurring,
  useRecurringPayments,
  useResumeRecurring,
} from "@/features/recurring/hooks";
import { RecurringCard } from "@/features/recurring/recurring-card";
import { RecurringFormDialog } from "@/features/recurring/recurring-form-dialog";
import type { RecurringPayment } from "@/features/recurring/types";

type Filter = "active" | "paused";

const GRID = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

function ListSkeleton() {
  return (
    <div
      className={GRID}
      aria-busy="true"
      aria-label="Loading recurring payments"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function RecurringPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [removing, setRemoving] = useState<RecurringPayment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formNonce, setFormNonce] = useState(0);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);

  const query = useRecurringPayments();
  const pause = usePauseRecurring();
  const resume = useResumeRecurring();
  const remove = useDeleteRecurring();
  const busy = pause.isPending || resume.isPending || remove.isPending;

  const all = query.data ?? [];
  const activeList = all.filter((p) => p.isActive);
  const inactiveList = all.filter((p) => !p.isActive);
  const visible = filter === "active" ? activeList : inactiveList;
  const nextUp = activeList.reduce<RecurringPayment | null>(
    (soonest, p) =>
      soonest === null || p.nextDueDate < soonest.nextDueDate ? p : soonest,
    null,
  );

  const openAdd = () => {
    setEditing(null);
    setFormNonce((n) => n + 1);
    setFormOpen(true);
  };
  const openEdit = (p: RecurringPayment) => {
    setEditing(p);
    setFormOpen(true);
  };

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

    if (visible.length === 0) {
      return filter === "active" ? (
        <EmptyState
          title="No active recurring payments"
          description="Rent, subscriptions and EMIs you add will show up here and create transactions automatically."
          action={
            <Button type="button" onClick={openAdd}>
              <Plus />
              Add payment
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Nothing paused or ended"
          description="Paused and ended payments appear here."
        />
      );
    }

    return (
      <ul className={GRID}>
        {visible.map((p) => (
          <li key={p.id}>
            <RecurringCard
              payment={p}
              busy={busy}
              onEdit={openEdit}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={setRemoving}
            />
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
        action={
          <Button type="button" onClick={openAdd}>
            <Plus />
            Add payment
          </Button>
        }
      />

      {query.isSuccess && all.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active" value={activeList.length} icon={Repeat} />
          <StatCard
            label="Paused / ended"
            value={inactiveList.length}
            icon={Pause}
          />
          <StatCard
            label="Next due"
            icon={CalendarClock}
            value={
              <span className="block truncate">
                {nextUp ? nextUp.name : "—"}
              </span>
            }
            description={
              nextUp ? formatDate(nextUp.nextDueDate) : "Nothing scheduled"
            }
          />
        </div>
      ) : null}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeList.length})</TabsTrigger>
          <TabsTrigger value="paused">
            Paused / ended ({inactiveList.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {renderBody()}

      <RecurringFormDialog
        key={editing?.id ?? `new-${formNonce}`}
        open={formOpen}
        payment={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      />

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
