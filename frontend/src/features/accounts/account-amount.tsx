import { formatINRString, isNegativeMoneyString } from "@/lib/format";

const unsignedMoneyString = (amount: string) =>
  amount.trim().startsWith("-") ? amount.trim().slice(1) : amount.trim();

export function AccountAmount({
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
