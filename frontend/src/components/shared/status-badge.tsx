import { cn } from "@/lib/utils";

type StatusBadgeTone = "income" | "expense" | "neutral" | "warning" | "danger";

const toneClass: Record<StatusBadgeTone, string> = {
  income: "bg-success-bg text-success",
  expense: "bg-danger-bg text-danger",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
