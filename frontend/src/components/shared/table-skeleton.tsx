import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 8, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="hidden gap-4 md:grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`h-${index}`} className="h-4" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="space-y-2 md:hidden">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={`d-${row}`}
            className="hidden gap-4 md:grid"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, column) => (
              <Skeleton key={column} className="h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
