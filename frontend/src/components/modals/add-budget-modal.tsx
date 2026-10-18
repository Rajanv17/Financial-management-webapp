import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchBudgets } from "@/features/budgets/api";
import {
  budgetEditFormSchema,
  budgetFormSchema,
} from "@/features/budgets/schemas";
import type { Category } from "@/features/categories/types";
import type {
  BudgetEditFormValues,
  BudgetFormValues,
  BudgetUpdatePayload,
  BudgetWithStats,
  BudgetWritePayload,
} from "@/features/budgets/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const yearOptions = (selectedYear: number) => {
  const current = new Date().getFullYear();
  const years = new Set<number>();
  for (let year = current - 10; year <= current + 5; year += 1) {
    years.add(year);
  }
  years.add(selectedYear);
  return [...years].sort((a, b) => b - a);
};

type BudgetFormDialogProps = {
  open: boolean;
  budget: BudgetWithStats | null;
  categories: Category[];
  defaultMonth: number;
  defaultYear: number;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: BudgetWritePayload) => Promise<void>;
  onUpdate: (payload: BudgetUpdatePayload) => Promise<void>;
};

export function AddBudgetModal({
  open,
  budget,
  categories,
  defaultMonth,
  defaultYear,
  pending,
  onOpenChange,
  onCreate,
  onUpdate,
}: BudgetFormDialogProps) {
  const isMobile = useIsMobile();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = budget !== null;

  const createForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      month: defaultMonth,
      year: defaultYear,
    },
  });

  const editForm = useForm<BudgetEditFormValues>({
    resolver: zodResolver(budgetEditFormSchema),
    defaultValues: {
      amount: budget ? String(budget.amount) : "",
      isActive: budget?.isActive ?? true,
    },
  });

  const selectedMonth = useWatch({ control: createForm.control, name: "month" });
  const selectedYear = useWatch({ control: createForm.control, name: "year" });
  const selectedCategoryId = useWatch({
    control: createForm.control,
    name: "categoryId",
  });

  const formMonth = selectedMonth ?? defaultMonth;
  const formYear = selectedYear ?? defaultYear;

  const existingBudgetsQuery = useQuery({
    queryKey: queryKeys.budgets.list(formMonth, formYear),
    queryFn: () => fetchBudgets(formMonth, formYear),
    enabled: open && !isEdit,
  });

  const availableCategories = useMemo(() => {
    const taken = new Set(
      (existingBudgetsQuery.data ?? []).map((item) => item.categoryId),
    );
    return categories.filter(
      (category) => category.type === "expense" && !taken.has(category.id),
    );
  }, [categories, existingBudgetsQuery.data]);

  const submitCreate = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onCreate({
        categoryId: values.categoryId,
        amount: Number(values.amount),
        month: values.month,
        year: values.year,
      });
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save the budget. Try again.",
      );
    }
  });

  const submitEdit = editForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onUpdate({
        amount: Number(values.amount),
        isActive: values.isActive,
      });
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save the budget. Try again.",
      );
    }
  });

  const fields = isEdit ? (
    <form id="budget-form" onSubmit={submitEdit} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Category: {budget.category.name}. Only the amount can be changed for
        this month.
      </p>
      <div className="space-y-2">
        <Label htmlFor="budget-amount">Amount</Label>
        <Input
          id="budget-amount"
          inputMode="decimal"
          aria-invalid={!!editForm.formState.errors.amount}
          aria-describedby={
            editForm.formState.errors.amount ? "budget-amount-error" : undefined
          }
          {...editForm.register("amount")}
        />
        {editForm.formState.errors.amount ? (
          <p id="budget-amount-error" className="text-sm text-destructive">
            {editForm.formState.errors.amount.message}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="budget-active"
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          {...editForm.register("isActive")}
        />
        <Label htmlFor="budget-active">Active</Label>
      </div>
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
    </form>
  ) : (
    <form
      id="budget-form"
      onSubmit={submitCreate}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="budget-category">Category</Label>
        <Select
          value={selectedCategoryId || undefined}
          onValueChange={(value) => createForm.setValue("categoryId", value)}
        >
          <SelectTrigger
            id="budget-category"
            className="w-full"
            aria-invalid={!!createForm.formState.errors.categoryId}
            aria-describedby={
              createForm.formState.errors.categoryId
                ? "budget-category-error"
                : undefined
            }
          >
            <SelectValue
              placeholder={
                availableCategories.length === 0
                  ? "No expense categories left this month"
                  : "Select a category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {createForm.formState.errors.categoryId ? (
          <p id="budget-category-error" className="text-sm text-destructive">
            {createForm.formState.errors.categoryId.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-amount">Amount</Label>
        <Input
          id="budget-amount"
          inputMode="decimal"
          aria-invalid={!!createForm.formState.errors.amount}
          aria-describedby={
            createForm.formState.errors.amount ? "budget-amount-error" : undefined
          }
          {...createForm.register("amount")}
        />
        {createForm.formState.errors.amount ? (
          <p id="budget-amount-error" className="text-sm text-destructive">
            {createForm.formState.errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budget-month">Month</Label>
          <Select
            value={String(selectedMonth)}
            onValueChange={(value) => {
              createForm.setValue("month", Number(value));
              createForm.setValue("categoryId", "");
            }}
          >
            <SelectTrigger id="budget-month" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget-year">Year</Label>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => {
              createForm.setValue("year", Number(value));
              createForm.setValue("categoryId", "");
            }}
          >
            <SelectTrigger id="budget-year" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions(selectedYear ?? defaultYear).map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      <Button
        type="submit"
        form="budget-form"
        disabled={pending || (!isEdit && availableCategories.length === 0)}
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create budget"}
      </Button>
    </>
  );

  const title = isEdit ? "Edit budget" : "Create budget";

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
