import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared";
import { AccountAmount } from "@/features/accounts/account-amount";
import { ACCOUNT_TYPE_LABELS, type Account } from "@/features/accounts/types";

type AccountCardProps = {
  account: Account;
  actions?: ReactNode;
};

export function AccountCard({ account, actions }: AccountCardProps) {
  return (
    <article className="relative rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40">
      <Link
        to={`/dashboard/accounts/${account.id}`}
        aria-label={`View ${account.name}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="relative space-y-1.5 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
              style={
                account.color ? { backgroundColor: account.color } : undefined
              }
              aria-hidden="true"
            />
            <h2 className="truncate font-medium text-foreground">{account.name}</h2>
            {account.isDefault ? (
              <Badge variant="secondary">Default</Badge>
            ) : null}
          </div>
          {actions ? (
            <div
              className="relative z-10 flex shrink-0 items-center gap-1 pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {actions}
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <StatusBadge
            label={ACCOUNT_TYPE_LABELS[account.type]}
            tone="neutral"
          />
          {account.institutionName ? (
            <span className="truncate text-xs text-muted-foreground">
              {account.institutionName}
            </span>
          ) : null}
        </div>
        <p className="text-lg font-semibold tracking-tight">
          <AccountAmount
            amount={account.balance}
            isCreditCard={account.type === "credit_card"}
          />
        </p>
      </div>
    </article>
  );
}
