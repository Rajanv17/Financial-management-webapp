import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { toWritePayload } from "./api";
import {
  useAccountOptions,
  useCategoryOptions,
  useCreateRecurring,
  useUpdateRecurring,
} from "./hooks";
import { recurringBillFormSchema } from "./schemas";
import {
  FREQUENCY_LABELS,
  type RecurringFormValues,
  type RecurringFrequency,
  type RecurringPayment,
  type RecurringType,
  type RecurringUpdatePayload,
} from "./types";

const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): RecurringFormValues => ({
  name: "",
  type: "expense",
  amount: "",
  frequency: "monthly",
  startDate: todayInputValue(),
  endDate: "",
  accountId: "",
  categoryId: "",
});

const valuesFromPayment = (p: RecurringPayment): RecurringFormValues => ({
  name: p.name,
  type: p.type,
  amount: String(p.amount),
  frequency: p.frequency,
  startDate: p.startDate,
  endDate: p.endDate ?? "",
  accountId: p.accountId,
  categoryId: p.categoryId,
});

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

type Props = {
  open: boolean;
  payment: RecurringPayment | null;
  onOpenChange: (open: boolean) => void;
};

export function RecurringFormDialog({ open, payment, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const isEdit = payment !== null;
  const [serverError, setServerError] = useState<string | null>(null);

  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const accountsQuery = useAccountOptions();
  const categoriesQuery = useCategoryOptions();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringBillFormSchema),
    defaultValues: payment ? valuesFromPayment(payment) : emptyValues(),
  });
  const { errors } = form.formState;

  const type = useWatch({ control: form.control, name: "type" });
  const frequency = useWatch({ control: form.control, name: "frequency" });
  const accountId = useWatch({ control: form.control, name: "accountId" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });

  // Keep the payment's current account/category selectable even if it was archived since.
  const accounts = useMemo(() => {
    const list = (accountsQuery.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
    }));
    if (payment && !list.some((a) => a.id === payment.accountId)) {
      list.push({
        id: payment.account.id,
        name: `${payment.account.name} (archived)`,
      });
    }
    return list;
  }, [accountsQuery.data, payment]);

  const categories = useMemo(() => {
    const list = (categoriesQuery.data ?? [])
      .filter((c) => c.type === type)
      .map((c) => ({ id: c.id, name: c.name }));
    if (
      payment &&
      type === payment.type &&
      !list.some((c) => c.id === payment.categoryId)
    ) {
      list.push({
        id: payment.category.id,
        name: `${payment.category.name} (archived)`,
      });
    }
    return list;
  }, [categoriesQuery.data, payment, type]);

  const pending = create.isPending || update.isPending;

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (payment) {
        const input: RecurringUpdatePayload = {};
        if (values.name !== payment.name) input.name = values.name;
        if (Number(values.amount) !== payment.amount)
          input.amount = values.amount;
        if (values.accountId !== payment.accountId)
          input.accountId = values.accountId;
        if (values.categoryId !== payment.categoryId)
          input.categoryId = values.categoryId;
        const endDate = values.endDate || null;
        if (endDate !== payment.endDate) input.endDate = endDate;

        if (Object.keys(input).length > 0) {
          await update.mutateAsync({ id: payment.id, input });
          toast.success("Recurring payment updated");
        }
      } else {
        await create.mutateAsync(toWritePayload(values));
        toast.success("Recurring payment created");
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  const fieldError = (name: keyof RecurringFormValues) =>
    errors[name] ? (
      <p id={`rec-${name}-error`} className="text-sm text-destructive">
        {errors[name]?.message}
      </p>
    ) : null;

  const describedBy = (name: keyof RecurringFormValues) =>
    errors[name] ? `rec-${name}-error` : undefined;

  const fields = (
    <form
      id="recurring-form"
      onSubmit={submit}
      className="space-y-4"
      noValidate
    >
      <ToggleGroup
        type="single"
        value={type}
        disabled={isEdit}
        onValueChange={(value) => {
          if (!value || value === type) return;
          form.setValue("type", value as RecurringType);
          form.setValue("categoryId", ""); // categories are per type
        }}
        className="w-full"
        aria-label="Payment type"
      >
        <ToggleGroupItem value="expense" className="flex-1">
          Expense
        </ToggleGroupItem>
        <ToggleGroupItem value="income" className="flex-1">
          Income
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="space-y-2">
        <Label htmlFor="rec-name">Name</Label>
        <Input
          id="rec-name"
          placeholder="e.g. House rent"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          {...form.register("name")}
        />
        {fieldError("name")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rec-amount">Amount (₹)</Label>
        <Input
          id="rec-amount"
          inputMode="decimal"
          aria-invalid={!!errors.amount}
          aria-describedby={describedBy("amount")}
          {...form.register("amount")}
        />
        {fieldError("amount")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rec-frequency">Frequency</Label>
        <Select
          value={frequency}
          disabled={isEdit}
          onValueChange={(value) =>
            form.setValue("frequency", value as RecurringFrequency, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="rec-frequency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map(
              (f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rec-start">Start date</Label>
          <Input
            id="rec-start"
            type="date"
            min={isEdit ? undefined : todayInputValue()}
            disabled={isEdit}
            aria-invalid={!!errors.startDate}
            aria-describedby={describedBy("startDate")}
            {...form.register("startDate")}
          />
          {fieldError("startDate")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rec-end">End date (optional)</Label>
          <Input
            id="rec-end"
            type="date"
            aria-invalid={!!errors.endDate}
            aria-describedby={describedBy("endDate")}
            {...form.register("endDate")}
          />
          {fieldError("endDate")}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rec-account">Account</Label>
        <Select
          value={accountId || undefined}
          onValueChange={(value) =>
            form.setValue("accountId", value, { shouldValidate: true })
          }
        >
          <SelectTrigger
            id="rec-account"
            className="w-full"
            aria-invalid={!!errors.accountId}
            aria-describedby={describedBy("accountId")}
          >
            <SelectValue
              placeholder={
                accountsQuery.isPending
                  ? "Loading accounts…"
                  : "Select an account"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("accountId")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rec-category">Category</Label>
        <Select
          value={categoryId || undefined}
          onValueChange={(value) =>
            form.setValue("categoryId", value, { shouldValidate: true })
          }
        >
          <SelectTrigger
            id="rec-category"
            className="w-full"
            aria-invalid={!!errors.categoryId}
            aria-describedby={describedBy("categoryId")}
          >
            <SelectValue
              placeholder={
                categoriesQuery.isPending
                  ? "Loading categories…"
                  : "Select a category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("categoryId")}
      </div>

      {isEdit ? (
        <p className="text-xs text-muted-foreground">
          Type, frequency and start date can&apos;t be changed. Delete and
          recreate to change them.
        </p>
      ) : null}

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
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
      <Button type="submit" form="recurring-form" disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save changes" : "Add payment"}
      </Button>
    </>
  );

  const title = isEdit ? "Edit recurring payment" : "Add recurring payment";

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
