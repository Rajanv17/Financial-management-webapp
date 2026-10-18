import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const financialTrend = [
  { month: "Jul", income: 4800, expense: 2000, savings: 800 },
  { month: "Aug", income: 4600, expense: 1900, savings: 1000 },
  { month: "Sep", income: 5000, expense: 2500, savings: 1200 },
  { month: "Oct", income: 5200, expense: 1800, savings: 300 },
  { month: "Nov", income: 5100, expense: 2400, savings: 1000 },
  { month: "Dec", income: 5000, expense: 2600, savings: 1100 },
  { month: "Jan", income: 5000, expense: 2800, savings: 1200 },
];

const spendingByCategory = [
  { name: "Food", value: 26, color: "#3b82f6" },
  { name: "Shopping", value: 18, color: "#eab308" },
  { name: "Utilities", value: 16, color: "#f97316" },
  { name: "Transport", value: 13, color: "#22c55e" },
  { name: "Entertainment", value: 10, color: "#a855f7" },
  { name: "Health", value: 9, color: "#06b6d4" },
  { name: "Other", value: 7, color: "#94a3b8" },
];

const weeklySpending = [
  { week: "Week 1", amount: 530 },
  { week: "Week 2", amount: 680 },
  { week: "Week 3", amount: 440 },
  { week: "Week 4", amount: 590 },
];

const expenseCategories = [
  { category: "Food", value: 450, color: "#3b82f6" },
  { category: "Transport", value: 375, color: "#22c55e" },
  { category: "Entertainment", value: 225, color: "#a855f7" },
  { category: "Shopping", value: 300, color: "#f97316" },
  { category: "Health", value: 175, color: "#06b6d4" },
  { category: "Utilities", value: 275, color: "#eab308" },
  { category: "Other", value: 125, color: "#94a3b8" },
];

const incomeSources = [
  { name: "Salary", value: 5000, color: "#22c55e" },
  { name: "Investments", value: 800, color: "#a855f7" },
  { name: "Other", value: 200, color: "#94a3b8" },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your finances.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 shadow-sm">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="cursor-pointer">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="cursor-pointer">
            Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Financial Trend Chart */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Financial Trend
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Income, expenses, and savings over time
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={financialTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    name="Expense"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="Savings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
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

            {/* Weekly Spending */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Weekly Spending
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This month&apos;s weekly breakdown
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6 mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Expense Categories
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of your spending
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={expenseCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6 mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Income Sources
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of your income streams
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-4">
                  {incomeSources.map((source) => (
                    <div key={source.name} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm">{source.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
