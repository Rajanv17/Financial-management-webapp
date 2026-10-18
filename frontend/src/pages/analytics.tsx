import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Money, PageHeader, StatusBadge } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/format";

const CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const axisAmount = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
};

// TODO(api): replace with analytics or dashboard aggregates when they exist.
const SAMPLE_TREND = [
  { month: "Jul", income: 48000, expense: 20000 },
  { month: "Aug", income: 46000, expense: 19000 },
  { month: "Sep", income: 50000, expense: 25000 },
  { month: "Oct", income: 52000, expense: 18000 },
  { month: "Nov", income: 51000, expense: 24000 },
  { month: "Dec", income: 50000, expense: 26000 },
];

// TODO(api)
const SAMPLE_SPENDING = [
  { name: "Food & Drinks", amount: 8500, fill: CHART_FILLS[0] },
  { name: "Housing", amount: 15000, fill: CHART_FILLS[1] },
  { name: "Shopping", amount: 4200, fill: CHART_FILLS[2] },
  { name: "Transportation", amount: 3100, fill: CHART_FILLS[3] },
  { name: "Life & Entertainment", amount: 2800, fill: CHART_FILLS[4] },
];

// TODO(api)
const SAMPLE_INCOME = [
  { name: "Salary", amount: 45000, fill: "var(--success)" },
  { name: "Freelance", amount: 5000, fill: CHART_FILLS[0] },
  { name: "Gifts", amount: 2000, fill: CHART_FILLS[2] },
];

type MoneyTooltipProps = {
  active?: boolean;
  payload?: { name?: string; value?: number }[];
  label?: string;
};

function MoneyTooltip({ active, payload, label }: MoneyTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-sm">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums text-muted-foreground">
          {entry.name}: {formatINR(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const reduceMotion = usePrefersReducedMotion();
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Sample charts for layout. These figures are not from your transactions and are not saved."
        badge={<StatusBadge label="Preview – not saved" tone="warning" />}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income and expenses</CardTitle>
              <CardDescription>
                Sample monthly series. Two lines are plotted, matching the legend.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
              <div className="h-72 min-w-0" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SAMPLE_TREND}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => axisAmount.format(value)}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      width={64}
                    />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="var(--success)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={!reduceMotion}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke="var(--danger)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={!reduceMotion}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-sm">
                <caption className="sr-only">Sample income and expenses by month</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 text-right font-medium">Income</th>
                    <th className="py-2 text-right font-medium">Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_TREND.map((point) => (
                    <tr key={point.month} className="border-b border-border last:border-0">
                      <td className="py-2 text-foreground">{point.month}</td>
                      <td className="py-2 text-right">
                        <Money amount={point.income} type="income" />
                      </td>
                      <td className="py-2 text-right">
                        <Money amount={point.expense} type="expense" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
                <CardDescription>Sample amounts, not a live breakdown.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                  <div className="h-64" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SAMPLE_SPENDING}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={2}
                          isAnimationActive={!reduceMotion}
                        >
                          {SAMPLE_SPENDING.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<MoneyTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2">
                    {SAMPLE_SPENDING.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="truncate text-foreground">{item.name}</span>
                        </span>
                        <Money amount={item.amount} className="shrink-0 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category amounts</CardTitle>
                <CardDescription>Same sample series as a bar chart.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={SAMPLE_SPENDING}
                      layout="vertical"
                      margin={{ left: 8, right: 8 }}
                    >
                      <CartesianGrid stroke="var(--border)" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value: number) => axisAmount.format(value)}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                      />
                      <Tooltip content={<MoneyTooltip />} />
                      <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                        {SAMPLE_SPENDING.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income sources</CardTitle>
              <CardDescription>Sample amounts, not a live breakdown.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                <div className="h-64" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SAMPLE_INCOME}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                        isAnimationActive={!reduceMotion}
                      >
                        {SAMPLE_INCOME.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<MoneyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2">
                  {SAMPLE_INCOME.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="truncate text-foreground">{item.name}</span>
                      </span>
                      <Money
                        amount={item.amount}
                        type="income"
                        className="shrink-0"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
