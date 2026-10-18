import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoneyProps = {
  amount: number;
  type?: "income" | "expense";
  className?: string;
};

export function Money({ amount, type, className }: MoneyProps) {
  const sign = type === "expense" ? "−" : "";

  return (
    <span
      className={cn(
        "tabular-nums",
        type === "income" && "text-success",
        type === "expense" && "text-danger",
        className,
      )}
    >
      {sign}
      {formatINR(amount)}
    </span>
  );
}
