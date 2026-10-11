import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Transaction = {
  id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  method: string;
  date: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "title",
    header: "Transaction",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.title}</p>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              type === "income"
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            )}
          >
            {type === "income" ? (
              <ArrowDownLeft className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </span>
          <span className="capitalize">{type}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-semibold",
          row.original.type === "income" ? "text-green-500" : "text-red-500"
        )}
      >
        {row.original.type === "income" ? "+" : "-"}₹
        {Math.abs(row.original.amount).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex gap-4">
        <Pencil className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        <Trash2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
      </div>
    ),
  },
];
