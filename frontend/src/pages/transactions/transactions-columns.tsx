import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { AccountBadge } from "@/features/accounts/account-badge";
import {
  PAYMENT_METHOD_LABELS,
  type Transaction,
} from "@/features/transactions/types";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

type ColumnActions = {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export const createTransactionColumns = ({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {formatDate(row.original.date)}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{row.original.title}</p>
        {row.original.description ? (
          <p className="truncate text-sm text-muted-foreground">
            {row.original.description}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return (
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
            style={
              category?.color ? { backgroundColor: category.color } : undefined
            }
          />
          <span>{category?.name ?? "—"}</span>
        </div>
      );
    },
  },
  {
    id: "account",
    header: "Account",
    cell: ({ row }) => {
      const account = row.original.account;
      if (!account) return "—";
      return <AccountBadge name={account.name} color={account.color} />;
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) =>
      row.original.paymentMethod
        ? PAYMENT_METHOD_LABELS[row.original.paymentMethod]
        : "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge
        label={row.original.type === "income" ? "Income" : "Expense"}
        tone={row.original.type}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Money amount={row.original.amount} type={row.original.type} />
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Edit transaction"
          onClick={() => onEdit(row.original)}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete transaction"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 />
        </Button>
      </div>
    ),
  },
];
