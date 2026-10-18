import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categoryFormSchema } from "@/features/categories/schemas";
import type { Category, CategoryFormInput } from "@/features/categories/types";
import { CATEGORY_ICON_OPTIONS, categoryIcon } from "@/features/categories/icons";
import { CATEGORY_COLORS } from "@/features/categories/palette";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_ICON = "tags";
const DEFAULT_COLOR = CATEGORY_COLORS[0];

const emptyValues = (): CategoryFormInput => ({
  name: "",
  type: "expense",
  icon: DEFAULT_ICON,
  color: DEFAULT_COLOR,
});

const valuesFromCategory = (category: Category): CategoryFormInput => ({
  name: category.name,
  type: category.type,
  icon: category.icon ?? DEFAULT_ICON,
  color: category.color ?? DEFAULT_COLOR,
});

type CategoryFormDialogProps = {
  open: boolean;
  category: Category | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CategoryFormInput) => Promise<void>;
};

export function CategoryFormDialog({
  open,
  category,
  pending,
  onOpenChange,
  onSubmit,
}: CategoryFormDialogProps) {
  const isMobile = useIsMobile();
  const isEdit = category !== null;
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category ? valuesFromCategory(category) : emptyValues(),
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const selectedIcon = useWatch({ control: form.control, name: "icon" });
  const selectedColor = useWatch({ control: form.control, name: "color" });

  const pickerColors = (CATEGORY_COLORS as readonly string[]).includes(selectedColor)
    ? CATEGORY_COLORS
    : ([selectedColor, ...CATEGORY_COLORS] as readonly string[]);

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        icon: values.icon,
        color: values.color,
      });
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save the category. Try again.",
      );
    }
  });

  const fields = (
    <form id="category-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          maxLength={50}
          aria-invalid={!!form.formState.errors.name}
          aria-describedby={
            form.formState.errors.name ? "category-name-error" : undefined
          }
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p id="category-name-error" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label id="category-type-label">Type</Label>
        <ToggleGroup
          type="single"
          value={selectedType}
          aria-labelledby="category-type-label"
          disabled={isEdit}
          onValueChange={(value) => {
            if (!isEdit && (value === "income" || value === "expense")) {
              form.setValue("type", value);
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
          <ToggleGroupItem value="income">Income</ToggleGroupItem>
        </ToggleGroup>
        {isEdit ? (
          <p className="text-xs text-muted-foreground">
            Type cannot be changed after a category is created.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label id="category-icon-label">Icon</Label>
        <div
          role="listbox"
          aria-labelledby="category-icon-label"
          className="grid grid-cols-6 gap-2 sm:grid-cols-8"
        >
          {CATEGORY_ICON_OPTIONS.map((name) => {
            const Icon = categoryIcon(name);
            const selected = selectedIcon === name;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={name.replaceAll("-", " ")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent",
                  selected && "border-ring bg-accent ring-2 ring-ring",
                )}
                onClick={() => form.setValue("icon", name, { shouldValidate: true })}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        {form.formState.errors.icon ? (
          <p className="text-sm text-destructive">{form.formState.errors.icon.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label id="category-colour-label">Colour</Label>
        <div
          role="listbox"
          aria-labelledby="category-colour-label"
          className="flex flex-wrap gap-2"
        >
          {pickerColors.map((color) => {
            const selected = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`Colour ${color}`}
                className={cn(
                  "size-8 rounded-full border border-border",
                  selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: color }}
                onClick={() => form.setValue("color", color, { shouldValidate: true })}
              />
            );
          })}
        </div>
        {form.formState.errors.color ? (
          <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
    </form>
  );

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button type="submit" form="category-form" disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save changes" : "Add category"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit category" : "Add category"}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-2">{fields}</div>
          <SheetFooter className="flex-row justify-end">{actions}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
