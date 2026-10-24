import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [58, 34, 72, 44, 64, 28];
const DONUT_RADIUS = 28;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP = 5;
const DONUT_SHARES = [0.34, 0.26, 0.22, 0.18] as const;
const DONUT_STROKES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const;
const DONUT_SEGMENTS = DONUT_SHARES.map((share, index) => {
  const offset = DONUT_SHARES.slice(0, index).reduce(
    (sum, value) => sum + value * DONUT_CIRCUMFERENCE,
    0,
  );
  return {
    stroke: DONUT_STROKES[index],
    length: share * DONUT_CIRCUMFERENCE - DONUT_GAP,
    offset,
  };
});

const Placeholder = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "block h-1.5 rounded-full bg-sidebar-foreground/20",
      className,
    )}
  />
);

export function AuthIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(
        "pointer-events-none relative mx-auto w-full max-w-[35rem] pb-8",
        className,
      )}
      {...({ focusable: "false" } as { focusable: "false" })}
    >
      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          {(["bg-success", "bg-danger", "bg-primary"] as const).map((tone) => (
            <div
              key={tone}
              className="space-y-2.5 rounded-lg bg-sidebar/55 p-3 ring-1 ring-sidebar-border/80"
            >
              <span className={cn("block size-2 rounded-sm", tone)} />
              <Placeholder className="w-[78%]" />
              <Placeholder className="w-[46%] opacity-80" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5">
          <svg
            viewBox="0 0 240 112"
            className="h-28 w-full"
            focusable="false"
            aria-hidden="true"
          >
            <line
              x1="8"
              y1="104"
              x2="232"
              y2="104"
              stroke="var(--sidebar-border)"
              strokeWidth="1"
            />
            {BAR_HEIGHTS.map((height, index) => {
              const x = 18 + index * 36;
              const y = 104 - height;
              const isIncome = index % 2 === 0;
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="18"
                  height={height}
                  rx="3"
                  fill={isIncome ? "var(--success)" : "var(--danger)"}
                />
              );
            })}
          </svg>

          <svg
            viewBox="0 0 88 88"
            className="size-[5.5rem] shrink-0"
            focusable="false"
            aria-hidden="true"
          >
            <circle
              cx="44"
              cy="44"
              r={DONUT_RADIUS}
              fill="none"
              stroke="var(--sidebar)"
              strokeWidth="11"
            />
            {DONUT_SEGMENTS.map((segment) => (
              <circle
                key={segment.stroke}
                cx="44"
                cy="44"
                r={DONUT_RADIUS}
                fill="none"
                stroke={segment.stroke}
                strokeWidth="11"
                strokeDasharray={`${segment.length} ${DONUT_CIRCUMFERENCE}`}
                strokeDashoffset={-segment.offset}
                transform="rotate(-90 44 44)"
              />
            ))}
          </svg>
        </div>

        <div className="mt-5 space-y-2.5">
          <Placeholder className="w-1/3" />
          <div className="h-2 overflow-hidden rounded-full bg-sidebar/70">
            <div className="h-full w-[86%] rounded-full bg-warning" />
          </div>
          <Placeholder className="w-1/5 opacity-80" />
        </div>
      </div>

      <div className="absolute right-5 bottom-0 w-[46%] max-w-[15.5rem] rounded-xl border border-sidebar-border bg-sidebar-accent p-3.5 shadow-sm">
        <Placeholder className="mb-2 w-[58%]" />
        <Placeholder className="mb-3 w-[34%] opacity-80" />
        <div className="h-2 overflow-hidden rounded-full bg-sidebar/70">
          <div className="h-full w-[88%] rounded-full bg-warning" />
        </div>
      </div>
    </div>
  );
}
