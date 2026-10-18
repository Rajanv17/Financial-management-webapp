import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Category } from "@/features/categories/types";
import { transactionFormSchema } from "@/features/transactions/schemas";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type Transaction,
  type TransactionFormValues,
  type TransactionWritePayload,
} from "@/features/transactions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api";

const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): TransactionFormValues => ({
  type: "expense",
  amount: "",
  date: todayInputValue(),
  categoryId: "",
  paymentMethod: "CASH",
  description: "",
  title: "",
});

const valuesFromTransaction = (transaction: Transaction): TransactionFormValues => ({
  type: transaction.type,
  amount: String(transaction.amount),
  date: transaction.date.slice(0, 10),
  categoryId: transaction.categoryId,
  paymentMethod: transaction.paymentMethod ?? "CASH",
  description: transaction.description ?? "",
  title: transaction.title,
});

const toPayload = (values: TransactionFormValues): TransactionWritePayload => ({
  type: values.type,
  amount: Number(values.amount),
  date: `${values.date}T00:00:00.000Z`,
  categoryId: values.categoryId,
  paymentMethod: values.paymentMethod,
  description: values.description.trim() === "" ? null : values.description.trim(),
  title: values.title.trim(),
});

type TransactionFormDialogProps = {
  open: boolean;
  transaction: Transaction | null;
  categories: Category[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: TransactionWritePayload) => Promise<void>;
};

export function TransactionFormDialog({
  open,
  transaction,
  categories,
  pending,
  onOpenChange,
  onSubmit,
}: TransactionFormDialogProps) {
  const isMobile = useIsMobile();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: transaction ? valuesFromTransaction(transaction) : emptyValues(),
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === selectedType),
    [categories, selectedType],
  );

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(toPayload(values));
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save the transaction. Try again.",
      );
    }
  });

  const fields = (
    <form id="transaction-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label id="transaction-type-label">Type</Label>
        <ToggleGroup
          type="single"
          value={selectedType}
          aria-labelledby="transaction-type-label"
          onValueChange={(value) => {
            if (value === "income" || value === "expense") {
              form.setValue("type", value);
              const currentCategory = form.getValues("categoryId");
              const stillValid = categories.some(
                (category) =>
                  category.id === currentCategory && category.type === value,
              );
              if (!stillValid) {
                form.setValue("categoryId", "");
              }
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
          <ToggleGroupItem value="income">Income</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-amount">Amount</Label>
        <Input
          id="transaction-amount"
          inputMode="decimal"
          aria-invalid={!!form.formState.errors.amount}
          aria-describedby={
            form.formState.errors.amount ? "transaction-amount-error" : undefined
          }
          {...form.register("amount")}
        />
        {form.formState.errors.amount ? (
          <p id="transaction-amount-error" className="text-sm text-destructive">
            {form.formState.errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-date">Date</Label>
        <Input
          id="transaction-date"
          type="date"
          aria-invalid={!!form.formState.errors.date}
          aria-describedby={
            form.formState.errors.date ? "transaction-date-error" : undefined
          }
          {...form.register("date")}
        />
        {form.formState.errors.date ? (
          <p id="transaction-date-error" className="text-sm text-destructive">
            {form.formState.errors.date.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-category">Category</Label>
        <Select
          value={selectedCategoryId || undefined}
          onValueChange={(value) => form.setValue("categoryId", value)}
        >
          <SelectTrigger
            id="transaction-category"
            className="w-full"
            aria-invalid={!!form.formState.errors.categoryId}
            aria-describedby={
              form.formState.errors.categoryId
                ? "transaction-category-error"
                : undefined
            }
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {visibleCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.categoryId ? (
          <p id="transaction-category-error" className="text-sm text-destructive">
            {form.formState.errors.categoryId.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-payment">Payment method</Label>
        <Select
          value={selectedPaymentMethod}
          onValueChange={(value) =>
            form.setValue("paymentMethod", value as PaymentMethod)
          }
        >
          <SelectTrigger id="transaction-payment" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
              (method) => (
                <SelectItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-description">Description</Label>
        <Textarea
          id="transaction-description"
          aria-invalid={!!form.formState.errors.description}
          aria-describedby={
            form.formState.errors.description
              ? "transaction-description-error"
              : undefined
          }
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p
            id="transaction-description-error"
            className="text-sm text-destructive"
          >
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-title">Title</Label>
        <Input
          id="transaction-title"
          aria-invalid={!!form.formState.errors.title}
          aria-describedby={
            form.formState.errors.title ? "transaction-title-error" : undefined
          }
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p id="transaction-title-error" className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
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
      <Button type="submit" form="transaction-form" disabled={pending}>
        {pending ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {transaction ? "Edit transaction" : "Add transaction"}
            </SheetTitle>
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
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
