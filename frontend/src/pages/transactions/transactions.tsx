import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTransactionModal } from "@/components/modals/add-transaction-modal";
import { columns } from "./transactions-columns";
import { DataTable } from "./data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Transaction = {
  id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  method: string;
  date: string;
};

// Mock Data

// const categoryColors: Record<string, string> = {
//   Food: "bg-orange-100 text-orange-700",
//   Salary: "bg-green-100 text-green-700",
//   Entertainment: "bg-purple-100 text-purple-700",
//   Transport: "bg-blue-100 text-blue-700",
//   Shopping: "bg-yellow-100 text-yellow-700",
// };

async function getData(): Promise<Transaction[]> {
  // Fetch data from your API here.
  return [
    {
      id: "1",
      amount: 100,
      title: "Grocery Shopping",
      type: "expense",
      method: "Credit Card",
      date: "Jan 2, 2024",
    },
    {
      id: "2",
      amount: 50000,
      title: "Monthly Salary",
      type: "income",
      method: "Bank",
      date: "Apr 1, 2023",
    },
    {
      id: "3",
      amount: 1050,
      title: "Movie tickets",
      type: "expense",
      method: "Credit Card",
      date: "Dec 12, 2025",
    },
    {
      id: "4",
      amount: 25000,
      title: "Freelance Project",
      type: "income",
      method: "PayPal",
      date: "Mar 15, 2024",
    },
    {
      id: "5",
      amount: 300,
      title: "Dinner at Restaurant",
      type: "expense",
      method: "UPI",
      date: "Feb 20, 2024",
    },
    {
      id: "6",
      amount: 1500,
      title: "Sold old furniture",
      type: "income",
      method: "Cash",
      date: "Jan 10, 2024",
    },
    {
      id: "7",
      amount: 200,
      title: "Public Transport",
      type: "expense",
      method: "Cash",
      date: "Aug 5, 2024",
    },
  ];
}

export default function TransactionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );

  // const filteredTransactions = data.filter((transaction) => {
  //   const matchesSearch = transaction.title
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase());
  //   const matchesType = filterType === "all" || transaction.type === filterType;
  //   return matchesSearch && matchesType;
  // });

  // const expenseTransactions = filteredTransactions.filter(
  //   (t) => t.type === "expense"
  // );
  // const incomeTransactions = filteredTransactions.filter(
  //   (t) => t.type === "income"
  // );

  useEffect(() => {
    getData().then(setData);
  }, []);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground pt-2">
            Manage your income and expenses.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Search and Filter */}
      <Card className="border-none bg-white shadow-md">
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 shadow-sm rounded-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as typeof filterType)}
            >
              <SelectTrigger className="w-full sm:w-30 h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto shadow-sm"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Transactions</DropdownMenuItem>
                <DropdownMenuItem>Date</DropdownMenuItem>
                <DropdownMenuItem>Amount</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        <Card className="border-none bg-white shadow-md">
          <CardContent>
            <div className="space-y-3">
              <DataTable columns={columns} data={data} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
