import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const summaryData = [
  {
    title: "Total Balance",
    value: "₹15,280",
    change: "+12.5% from last month",
    changeType: "positive",
    icon: Wallet,
  },
  {
    title: "Monthly Income",
    value: "₹5,000",
    change: "+8.2% from last month",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    title: "Monthly Expense",
    value: "₹2,340",
    change: "3.1% from last month",
    changeType: "negative",
    icon: TrendingDown,
  },
  {
    title: "Net Savings",
    value: "₹2,660",
    change: "+15.8% from last month",
    changeType: "positive",
    icon: ArrowUpDown,
  },
];

const spendingByCategory = [
  { name: "Food", value: 52, color: "#f97316" },
  { name: "Transport", value: 27, color: "#3b82f6" },
  { name: "Entertainment", value: 21, color: "#a855f7" },
  { name: "Utilities", value: 15, color: "#10b981" },
  { name: "Others", value: 10, color: "#ef4444" },
];

const incomeVsExpense = [
  { month: "Jan", income: 50000, expense: 25000 },
  { month: "Feb", income: 50000, expense: 20000 },
  { month: "Mar", income: 50000, expense: 25000 },
  { month: "Apr", income: 50000, expense: 35000 },
  { month: "May", income: 50000, expense: 22000 },
  { month: "Jun", income: 50000, expense: 17000 },
];

const recentTransactions = [
  {
    id: "1",
    title: "Grocery Shopping",
    date: "Jan 15, 2024",
    category: "Food",
    amount: -85.5,
    type: "expense",
  },
  {
    id: "2",
    title: "Monthly Salary",
    date: "Jan 1, 2024",
    category: "Salary",
    amount: 5000,
    type: "income",
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2 dark:text-foreground">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial status.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Card key={item.title} className="border-none shadow-md">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between ">
                <CardTitle className="text-lg font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <item.icon className="h-10 w-10 text-primary rounded-md p-2 bg-primary/10" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value}</p>
              <p
                className={`mt-2 text-xs ${
                  item.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spending by Category */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Spending by Category
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current month breakdown
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income vs Expense */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Income vs Expense
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last 3 months</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#17bf63" name="Income" />
                <Bar dataKey="expense" fill="#f4212e" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Recent Transactions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your latest financial activities
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {transaction.date}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}₹
                    {Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Upcoming Bills</CardTitle>
            <p className="text-sm text-muted-foreground">
              Bills due in the next 7 days
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No upcoming bills in the next 7 days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
