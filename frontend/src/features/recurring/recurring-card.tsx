import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { Money, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dueInfo, formatDate, hasEnded } from "./format";
import { FREQUENCY_LABELS, type RecurringPayment } from "./types";

type Props = {
  payment: RecurringPayment;
  busy: boolean;
  onHistory: (p: RecurringPayment) => void;
  onEdit: (p: RecurringPayment) => void;
  onPause: (p: RecurringPayment) => void;
  onResume: (p: RecurringPayment) => void;
  onDelete: (p: RecurringPayment) => void;
};

export function RecurringCard({
  payment: p,
  busy,
  onHistory,
  onEdit,
  onPause,
  onResume,
  onDelete,
}: Props) {
  const ended = hasEnded(p);
  const due = dueInfo(p.nextDueDate);

  const footerText = p.isActive
    ? `Next due ${formatDate(p.nextDueDate)}`
    : ended
      ? `Ended ${p.endDate ? formatDate(p.endDate) : ""}`
      : "Paused";

  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                p.type === "income"
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger",
              )}
            >
              {p.type === "income" ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{p.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {p.category.name} · {p.account.name}
              </p>
            </div>
          </div>
          <Money
            amount={p.amount}
            type={p.type}
            className="shrink-0 text-lg font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={FREQUENCY_LABELS[p.frequency]} />
          {p.isActive ? (
            <StatusBadge label={due.text} tone={due.tone} />
          ) : (
            <StatusBadge label={ended ? "Ended" : "Paused"} tone="warning" />
          )}
          {p.isActive && p.endDate ? (
            <StatusBadge label={`Ends ${formatDate(p.endDate)}`} />
          ) : null}
        </div>
      </CardContent>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-1.5">
        <span className="truncate text-xs text-muted-foreground">
          {footerText}
        </span>
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${p.name}`}
            title="Edit"
            disabled={busy}
            onClick={() => onEdit(p)}
          >
            <Pencil />
          </Button>
          {p.isActive ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Pause ${p.name}`}
              title="Pause"
              disabled={busy}
              onClick={() => onPause(p)}
            >
              <Pause />
            </Button>
          ) : !ended ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Resume ${p.name}`}
              title="Resume"
              disabled={busy}
              onClick={() => onResume(p)}
            >
              <Play />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${p.name}`}
            title="Delete"
            disabled={busy}
            onClick={() => onDelete(p)}
          >
            <Trash2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`History for ${p.name}`}
            title="History"
            onClick={() => onHistory(p)}
          >
            <History />
          </Button>
        </div>
      </div>
    </Card>
  );
}
