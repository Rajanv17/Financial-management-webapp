import { useState } from "react";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  Money,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillFormDialog } from "@/features/recurring/bill-form-dialog";
import {
  FREQUENCY_LABELS,
  type RecurringBill,
  type RecurringBillFormValues,
} from "@/features/recurring/types";
import { PAYMENT_METHOD_LABELS } from "@/features/transactions/types";

// TODO(api): replace with GET /recurring when that backend exists.
const SAMPLE_BILLS: RecurringBill[] = [
  {
    id: "preview-electricity",
    title: "Electricity bill",
    amount: 1300,
    category: "Housing",
    frequency: "monthly",
    nextDue: "2026-10-25",
    paymentMethod: "UPI",
    description: "",
  },
  {
    id: "preview-internet",
    title: "Internet",
    amount: 799,
    category: "Housing",
    frequency: "monthly",
    nextDue: "2026-10-28",
    paymentMethod: "UPI",
    description: "",
  },
  {
    id: "preview-netflix",
    title: "Netflix",
    amount: 649,
    category: "Life & Entertainment",
    frequency: "monthly",
    nextDue: "2026-11-01",
    paymentMethod: "CREDIT_CARD",
    description: "",
  },
  {
    id: "preview-mobile",
    title: "Mobile recharge",
    amount: 499,
    category: "Other financial expense",
    frequency: "monthly",
    nextDue: "2026-11-12",
    paymentMethod: "UPI",
    description: "",
  },
  {
    id: "preview-rent",
    title: "House rent",
    amount: 15000,
    category: "Housing",
    frequency: "monthly",
    nextDue: "2026-11-01",
    paymentMethod: "BANK_TRANSFER",
    description: "",
  },
];

const formatDueDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

const toBill = (
  values: RecurringBillFormValues,
  id: string,
): RecurringBill => ({
  id,
  title: values.title.trim(),
  amount: Number(values.amount),
  category: values.category,
  frequency: values.frequency,
  nextDue: values.nextDue,
  paymentMethod: values.paymentMethod,
  description: values.description.trim(),
});

type RecurringTab = "upcoming" | "history";

export default function RecurringPage() {
  const [bills, setBills] = useState<RecurringBill[]>(SAMPLE_BILLS);
  const [tab, setTab] = useState<RecurringTab>("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [formNonce, setFormNonce] = useState(0);
  const [editing, setEditing] = useState<RecurringBill | null>(null);
  const [removing, setRemoving] = useState<RecurringBill | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormNonce((value) => value + 1);
    setFormOpen(true);
  };

  const handleSubmit = (values: RecurringBillFormValues) => {
    if (editing) {
      setBills((current) =>
        current.map((bill) =>
          bill.id === editing.id ? toBill(values, editing.id) : bill,
        ),
      );
      toast.success("Preview updated. This is not saved.");
    } else {
      setBills((current) => [...current, toBill(values, crypto.randomUUID())]);
      toast.success("Added to this preview only. Nothing was saved.");
    }
    setFormOpen(false);
    setEditing(null);
    setTab("upcoming");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring bills"
        description="Sample bills for layout. Nothing here is stored until a recurring backend exists."
        badge={<StatusBadge label="Preview – not saved" tone="warning" />}
        action={
          <Button type="button" onClick={openAdd}>
            <Plus />
            Add bill
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as RecurringTab)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "history" ? (
        <EmptyState
          title="No payment history yet"
          description="When recurring bills have a backend, generated payments will appear here. This preview does not create transactions."
        />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No upcoming bills"
          description="Add a bill to see how this list will look. It stays in this browser tab only."
          action={
            <Button type="button" onClick={openAdd}>
              <Plus />
              Add bill
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <li key={bill.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-foreground">{bill.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Next due {formatDueDate(bill.nextDue)} ·{" "}
                        {FREQUENCY_LABELS[bill.frequency]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label={bill.category} />
                        <StatusBadge
                          label={PAYMENT_METHOD_LABELS[bill.paymentMethod]}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <Money
                      amount={bill.amount}
                      type="expense"
                      className="text-lg font-semibold"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${bill.title}`}
                        onClick={() => {
                          setEditing(bill);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${bill.title}`}
                        onClick={() => setRemoving(bill)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <BillFormDialog
        key={editing?.id ?? `new-bill-${formNonce}`}
        open={formOpen}
        bill={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove this preview bill?"
        description="It will disappear from this page only. Nothing is stored on the server."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) {
            setBills((current) => current.filter((bill) => bill.id !== removing.id));
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
