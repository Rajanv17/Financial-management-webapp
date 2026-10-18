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
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/features/transactions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { recurringBillFormSchema } from "./schemas";
import {
  FREQUENCY_LABELS,
  PREVIEW_BILL_CATEGORIES,
  type RecurringBill,
  type RecurringBillFormValues,
  type RecurringFrequency,
} from "./types";

const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): RecurringBillFormValues => ({
  title: "",
  amount: "",
  frequency: "monthly",
  nextDue: todayInputValue(),
  category: "",
  paymentMethod: "UPI",
  description: "",
});

const valuesFromBill = (bill: RecurringBill): RecurringBillFormValues => ({
  title: bill.title,
  amount: String(bill.amount),
  frequency: bill.frequency,
  nextDue: bill.nextDue,
  category: bill.category,
  paymentMethod: bill.paymentMethod,
  description: bill.description,
});

type BillFormDialogProps = {
  open: boolean;
  bill: RecurringBill | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecurringBillFormValues) => void;
};

export function BillFormDialog({
  open,
  bill,
  onOpenChange,
  onSubmit,
}: BillFormDialogProps) {
  const isMobile = useIsMobile();
  const isEdit = bill !== null;
  const form = useForm<RecurringBillFormValues>({
    resolver: zodResolver(recurringBillFormSchema),
    defaultValues: bill ? valuesFromBill(bill) : emptyValues(),
  });

  const selectedFrequency = useWatch({ control: form.control, name: "frequency" });
  const selectedCategory = useWatch({ control: form.control, name: "category" });
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const submit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  const pending = form.formState.isSubmitting;

  const fields = (
    <form id="recurring-bill-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="bill-name">Bill name</Label>
        <Input
          id="bill-name"
          placeholder="e.g. Electricity bill"
          aria-invalid={!!form.formState.errors.title}
          aria-describedby={
            form.formState.errors.title ? "bill-name-error" : undefined
          }
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p id="bill-name-error" className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-amount">Amount</Label>
        <Input
          id="bill-amount"
          inputMode="decimal"
          aria-invalid={!!form.formState.errors.amount}
          aria-describedby={
            form.formState.errors.amount ? "bill-amount-error" : undefined
          }
          {...form.register("amount")}
        />
        {form.formState.errors.amount ? (
          <p id="bill-amount-error" className="text-sm text-destructive">
            {form.formState.errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-frequency">Frequency</Label>
        <Select
          value={selectedFrequency}
          onValueChange={(value) =>
            form.setValue("frequency", value as RecurringFrequency, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="bill-frequency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map(
              (frequency) => (
                <SelectItem key={frequency} value={frequency}>
                  {FREQUENCY_LABELS[frequency]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-next-due">Next due date</Label>
        <Input
          id="bill-next-due"
          type="date"
          aria-invalid={!!form.formState.errors.nextDue}
          aria-describedby={
            form.formState.errors.nextDue ? "bill-next-due-error" : undefined
          }
          {...form.register("nextDue")}
        />
        {form.formState.errors.nextDue ? (
          <p id="bill-next-due-error" className="text-sm text-destructive">
            {form.formState.errors.nextDue.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-category">Category</Label>
        <Select
          value={selectedCategory || undefined}
          onValueChange={(value) =>
            form.setValue("category", value, { shouldValidate: true })
          }
        >
          <SelectTrigger
            id="bill-category"
            className="w-full"
            aria-invalid={!!form.formState.errors.category}
            aria-describedby={
              form.formState.errors.category ? "bill-category-error" : undefined
            }
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_BILL_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category ? (
          <p id="bill-category-error" className="text-sm text-destructive">
            {form.formState.errors.category.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-payment">Payment method</Label>
        <Select
          value={selectedPaymentMethod}
          onValueChange={(value) =>
            form.setValue("paymentMethod", value as PaymentMethod, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="bill-payment" className="w-full">
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
        <Label htmlFor="bill-notes">Notes</Label>
        <Textarea
          id="bill-notes"
          aria-invalid={!!form.formState.errors.description}
          aria-describedby={
            form.formState.errors.description ? "bill-notes-error" : undefined
          }
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p id="bill-notes-error" className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>
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
      <Button type="submit" form="recurring-bill-form" disabled={pending}>
        {isEdit ? "Save changes" : "Add bill"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit recurring bill" : "Add recurring bill"}</SheetTitle>
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
            {isEdit ? "Edit recurring bill" : "Add recurring bill"}
          </DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
