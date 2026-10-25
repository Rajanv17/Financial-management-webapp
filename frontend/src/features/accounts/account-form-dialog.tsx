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
import { accountFormSchema } from "@/features/accounts/schemas";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  type Account,
  type AccountFormValues,
  type AccountType,
  type AccountWritePayload,
} from "@/features/accounts/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api";

const emptyValues = (): AccountFormValues => ({
  name: "",
  type: "bank",
  institutionName: "",
  openingBalance: "",
});

const valuesFromAccount = (account: Account): AccountFormValues => ({
  name: account.name,
  type: account.type,
  institutionName: account.institutionName ?? "",
  openingBalance: account.openingBalance,
});

const toPayload = (values: AccountFormValues): AccountWritePayload => ({
  name: values.name.trim(),
  type: values.type,
  institutionName: values.institutionName.trim() || null,
  ...(values.openingBalance.trim() !== ""
    ? { openingBalance: values.openingBalance.trim() }
    : {}),
});

type AccountFormDialogProps = {
  open: boolean;
  account: Account | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AccountWritePayload) => Promise<void>;
};

export function AccountFormDialog({
  open,
  account,
  pending,
  onOpenChange,
  onSubmit,
}: AccountFormDialogProps) {
  const isMobile = useIsMobile();
  const isEdit = account !== null;
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account ? valuesFromAccount(account) : emptyValues(),
  });

  const selectedType = useWatch({ control: form.control, name: "type" });

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(toPayload(values));
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save the account. Try again.",
      );
    }
  });

  const fields = (
    <form id="account-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="account-name">Name</Label>
        <Input
          id="account-name"
          maxLength={50}
          aria-invalid={!!form.formState.errors.name}
          aria-describedby={
            form.formState.errors.name ? "account-name-error" : undefined
          }
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p id="account-name-error" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-type">Type</Label>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            form.setValue("type", value as AccountType, { shouldValidate: true })
          }
        >
          <SelectTrigger
            id="account-type"
            className="w-full"
            aria-invalid={!!form.formState.errors.type}
            aria-describedby={
              form.formState.errors.type ? "account-type-error" : undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.type ? (
          <p id="account-type-error" className="text-sm text-destructive">
            {form.formState.errors.type.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-institution">Institution</Label>
        <Input
          id="account-institution"
          maxLength={100}
          aria-invalid={!!form.formState.errors.institutionName}
          aria-describedby={
            form.formState.errors.institutionName
              ? "account-institution-error"
              : undefined
          }
          {...form.register("institutionName")}
        />
        {form.formState.errors.institutionName ? (
          <p
            id="account-institution-error"
            className="text-sm text-destructive"
          >
            {form.formState.errors.institutionName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-opening-balance">Opening balance</Label>
        <Input
          id="account-opening-balance"
          inputMode="decimal"
          aria-invalid={!!form.formState.errors.openingBalance}
          aria-describedby={
            form.formState.errors.openingBalance
              ? "account-opening-balance-error"
              : "account-opening-balance-hint"
          }
          {...form.register("openingBalance")}
        />
        <p
          id="account-opening-balance-hint"
          className="text-xs text-muted-foreground"
        >
          Optional. Use a negative value for an amount already owed on a credit
          card.
        </p>
        {form.formState.errors.openingBalance ? (
          <p
            id="account-opening-balance-error"
            className="text-sm text-destructive"
          >
            {form.formState.errors.openingBalance.message}
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
      <Button type="submit" form="account-form" disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save changes" : "Add account"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit account" : "Add account"}</SheetTitle>
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
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>
        {fields}
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
