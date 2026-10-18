import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/format";

const axisAmount = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

type TooltipRow = {
  name?: string;
  value?: number;
};

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-4 tabular-nums text-muted-foreground"
          >
            <span>{item.name}</span>
            <span className="text-foreground">
              {typeof item.value === "number" ? formatINR(item.value) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type MonthlyChartPoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

export type CategoryChartPoint = {
  categoryId: string;
  displayName: string;
  total: number;
  percent: number;
  fill: string;
};

export function CashFlowChart({
  data,
  reduceMotion,
}: {
  data: MonthlyChartPoint[];
  reduceMotion: boolean;
}) {
  return (
    <>
      <div className="h-72 min-w-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
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
            <Tooltip cursor={{ fill: "var(--muted)" }} content={<MoneyTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="var(--success)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="var(--danger)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Income versus expenses by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expense</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}>
              <td>{point.label}</td>
              <td>{formatINR(point.income)}</td>
              <td>{formatINR(point.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CategorySpendChart({
  data,
  expenseTotal,
  reduceMotion,
}: {
  data: CategoryChartPoint[];
  expenseTotal: number;
  reduceMotion: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
      <div className="relative h-64 min-w-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="displayName"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              isAnimationActive={!reduceMotion}
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatINR(expenseTotal)}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {data.map((item) => (
          <li
            key={item.categoryId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full bg-chart-1"
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate text-foreground">{item.displayName}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatINR(item.total)} · {item.percent}%
            </span>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>Spending by category</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Percent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.categoryId}>
              <td>{item.displayName}</td>
              <td>{formatINR(item.total)}</td>
              <td>{item.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
