import { ChevronLeft, ChevronRight } from "lucide-react";
import { Money, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { AccountBadge } from "@/features/accounts/account-badge";
import {
  PAYMENT_METHOD_LABELS,
  type Transaction,
  type TransactionList,
} from "@/features/transactions/types";
import { DataTable } from "./data-table";
import { createTransactionColumns } from "./transactions-columns";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

type TransactionResultsProps = {
  items: Transaction[];
  pagination?: TransactionList["pagination"];
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionResults({
  items,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionResultsProps) {
  const columns = createTransactionColumns({ onEdit, onDelete });

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((transaction) => (
          <article
            key={transaction.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{transaction.title}</p>
                {transaction.description ? (
                  <p className="text-sm text-muted-foreground">
                    {transaction.description}
                  </p>
                ) : null}
              </div>
              <Money amount={transaction.amount} type={transaction.type} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="tabular-nums">{formatDate(transaction.date)}</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full bg-muted-foreground"
                  style={
                    transaction.category?.color
                      ? { backgroundColor: transaction.category.color }
                      : undefined
                  }
                />
                {transaction.category?.name ?? "—"}
              </span>
              {transaction.account ? (
                <AccountBadge
                  name={transaction.account.name}
                  color={transaction.account.color}
                />
              ) : null}
              <span>
                {transaction.paymentMethod
                  ? PAYMENT_METHOD_LABELS[transaction.paymentMethod]
                  : "—"}
              </span>
              <StatusBadge
                label={transaction.type === "income" ? "Income" : "Expense"}
                tone={transaction.type}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(transaction)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDelete(transaction)}
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={items} />
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            >
              <ChevronLeft />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
