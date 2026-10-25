import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("h-full gap-3 py-5 shadow-sm", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {Icon ? (
            <Icon className="size-10 shrink-0 rounded-md bg-primary/10 p-2 text-primary" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        {description ? (
          <div className="mt-auto pt-2 text-sm font-normal text-muted-foreground">
            {description}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
