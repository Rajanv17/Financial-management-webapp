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
import { useIsMobile } from "@/hooks/use-mobile";
import { investmentFormSchema } from "./schemas";
import {
  INVESTMENT_TYPE_LABELS,
  type Investment,
  type InvestmentFormValues,
  type InvestmentType,
} from "./types";

const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): InvestmentFormValues => ({
  name: "",
  type: "stocks",
  initialAmount: "",
  currentValue: "",
  quantity: "",
  purchaseDate: todayInputValue(),
  notes: "",
});

const valuesFromInvestment = (investment: Investment): InvestmentFormValues => ({
  name: investment.name,
  type: investment.type,
  initialAmount: String(investment.initialAmount),
  currentValue: String(investment.currentValue),
  quantity: investment.quantity == null ? "" : String(investment.quantity),
  purchaseDate: investment.purchaseDate,
  notes: investment.notes,
});

type InvestmentFormDialogProps = {
  open: boolean;
  investment: Investment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvestmentFormValues) => void;
};

export function InvestmentFormDialog({
  open,
  investment,
  onOpenChange,
  onSubmit,
}: InvestmentFormDialogProps) {
  const isMobile = useIsMobile();
  const isEdit = investment !== null;
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: investment ? valuesFromInvestment(investment) : emptyValues(),
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const pending = form.formState.isSubmitting;

  const submit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  const fields = (
    <form id="investment-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="investment-type">Investment type</Label>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            form.setValue("type", value as InvestmentType, { shouldValidate: true })
          }
        >
          <SelectTrigger id="investment-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(INVESTMENT_TYPE_LABELS) as InvestmentType[]).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {INVESTMENT_TYPE_LABELS[type]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-name">Name</Label>
        <Input
          id="investment-name"
          placeholder="e.g. Reliance Industries"
          aria-invalid={!!form.formState.errors.name}
          aria-describedby={
            form.formState.errors.name ? "investment-name-error" : undefined
          }
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p id="investment-name-error" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-purchase-date">Purchase date</Label>
        <Input
          id="investment-purchase-date"
          type="date"
          aria-invalid={!!form.formState.errors.purchaseDate}
          aria-describedby={
            form.formState.errors.purchaseDate
              ? "investment-purchase-date-error"
              : undefined
          }
          {...form.register("purchaseDate")}
        />
        {form.formState.errors.purchaseDate ? (
          <p
            id="investment-purchase-date-error"
            className="text-sm text-destructive"
          >
            {form.formState.errors.purchaseDate.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-quantity">Quantity</Label>
        <Input
          id="investment-quantity"
          inputMode="decimal"
          placeholder="Optional"
          aria-invalid={!!form.formState.errors.quantity}
          aria-describedby={
            form.formState.errors.quantity
              ? "investment-quantity-error"
              : "investment-quantity-help"
          }
          {...form.register("quantity")}
        />
        {form.formState.errors.quantity ? (
          <p id="investment-quantity-error" className="text-sm text-destructive">
            {form.formState.errors.quantity.message}
          </p>
        ) : (
          <p id="investment-quantity-help" className="text-xs text-muted-foreground">
            Shares, units, or grams. Leave blank if it does not apply.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-initial">Amount invested</Label>
        <Input
          id="investment-initial"
          inputMode="decimal"
          aria-invalid={!!form.formState.errors.initialAmount}
          aria-describedby={
            form.formState.errors.initialAmount
              ? "investment-initial-error"
              : undefined
          }
          {...form.register("initialAmount")}
        />
        {form.formState.errors.initialAmount ? (
          <p id="investment-initial-error" className="text-sm text-destructive">
            {form.formState.errors.initialAmount.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-current">Current value (manual)</Label>
        <Input
          id="investment-current"
          inputMode="decimal"
          aria-invalid={!!form.formState.errors.currentValue}
          aria-describedby={
            form.formState.errors.currentValue
              ? "investment-current-error"
              : "investment-current-help"
          }
          {...form.register("currentValue")}
        />
        {form.formState.errors.currentValue ? (
          <p id="investment-current-error" className="text-sm text-destructive">
            {form.formState.errors.currentValue.message}
          </p>
        ) : (
          <p id="investment-current-help" className="text-xs text-muted-foreground">
            Entered by you. This is not a live market price.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-notes">Notes</Label>
        <Textarea
          id="investment-notes"
          aria-invalid={!!form.formState.errors.notes}
          aria-describedby={
            form.formState.errors.notes ? "investment-notes-error" : undefined
          }
          {...form.register("notes")}
        />
        {form.formState.errors.notes ? (
          <p id="investment-notes-error" className="text-sm text-destructive">
            {form.formState.errors.notes.message}
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
      <Button type="submit" form="investment-form" disabled={pending}>
        {isEdit ? "Save changes" : "Add investment"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit investment" : "Add investment"}</SheetTitle>
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
          <DialogTitle>{isEdit ? "Edit investment" : "Add investment"}</DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
