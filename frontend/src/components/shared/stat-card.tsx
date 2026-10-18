import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {Icon ? (
            <Icon className="size-10 rounded-md bg-primary/10 p-2 text-primary" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
