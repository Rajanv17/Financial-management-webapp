import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
import type { Category } from "@/features/categories/types";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const typeColors = {
    income: "bg-success/10 text-success border-success/20",
    expense: "bg-destructive/10 text-destructive border-destructive/20",
    both: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <Card className="group transition-all hover:shadow-lg h-25 border-none shadow-md">
      <CardContent className="">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
              style={
                category.color
                  ? { backgroundColor: `${category.color}20` }
                  : undefined
              }
            >
              <div
                className="h-4 w-4 rounded-full bg-muted-foreground"
                style={
                  category.color
                    ? { backgroundColor: category.color }
                    : undefined
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {category.name}
                </h3>
                {category.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={`mt-1 text-xs capitalize ${
                  typeColors[category.type]
                }`}
              >
                {category.type}
              </Badge>
            </div>
          </div>

          {!category.isDefault && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(category)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
