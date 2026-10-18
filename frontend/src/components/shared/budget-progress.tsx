import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

type BudgetProgressProps = {
  percentageUsed: number;
  status: "under_limit" | "near_limit" | "exceeded";
  className?: string;
};

function budgetStatusPresentation(
  percentageUsed: number,
  status: BudgetProgressProps["status"],
) {
  if (status === "exceeded") {
    return { label: "Over budget", tone: "danger" as const };
  }
  if (percentageUsed >= 80) {
    return { label: "Near limit", tone: "warning" as const };
  }
  return { label: "Normal", tone: "income" as const };
}

export function BudgetProgress({
  percentageUsed,
  status,
  className,
}: BudgetProgressProps) {
  const presentation = budgetStatusPresentation(percentageUsed, status);
  const barWidth = Math.min(Math.max(percentageUsed, 0), 100);
  const barTone =
    presentation.tone === "danger"
      ? "bg-danger"
      : presentation.tone === "warning"
        ? "bg-warning"
        : "bg-success";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barTone)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm tabular-nums text-muted-foreground">
          {percentageUsed}% used
        </span>
        <StatusBadge label={presentation.label} tone={presentation.tone} />
      </div>
    </div>
  );
}
