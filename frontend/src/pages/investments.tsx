import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  Money,
  PageHeader,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentFormDialog } from "@/features/investments/investment-form-dialog";
import {
  INVESTMENT_TYPE_LABELS,
  type Investment,
  type InvestmentFormValues,
} from "@/features/investments/types";

// TODO(api): replace with GET /investments when that backend exists.
const SAMPLE_INVESTMENTS: Investment[] = [
  {
    id: "preview-reliance",
    name: "Reliance Industries",
    type: "stocks",
    initialAmount: 5000,
    currentValue: 5000,
    quantity: 40,
    purchaseDate: "2023-06-15",
    notes: "",
  },
  {
    id: "preview-hdfc",
    name: "HDFC Mutual Fund",
    type: "mutual_funds",
    initialAmount: 10000,
    currentValue: 10000,
    quantity: null,
    purchaseDate: "2023-01-10",
    notes: "",
  },
  {
    id: "preview-gold",
    name: "Sovereign gold",
    type: "gold",
    initialAmount: 8000,
    currentValue: 8000,
    quantity: 2,
    purchaseDate: "2024-03-01",
    notes: "",
  },
];

const formatPurchaseDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

const toInvestment = (
  values: InvestmentFormValues,
  id: string,
): Investment => ({
  id,
  name: values.name.trim(),
  type: values.type,
  initialAmount: Number(values.initialAmount),
  currentValue: Number(values.currentValue),
  quantity: values.quantity.trim() === "" ? null : Number(values.quantity),
  purchaseDate: values.purchaseDate,
  notes: values.notes.trim(),
});

export default function InvestmentsPage() {
  const [holdings, setHoldings] = useState<Investment[]>(SAMPLE_INVESTMENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [formNonce, setFormNonce] = useState(0);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [removing, setRemoving] = useState<Investment | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormNonce((value) => value + 1);
    setFormOpen(true);
  };

  const handleSubmit = (values: InvestmentFormValues) => {
    if (editing) {
      setHoldings((current) =>
        current.map((item) =>
          item.id === editing.id ? toInvestment(values, editing.id) : item,
        ),
      );
      toast.success("Preview updated. This is not saved.");
    } else {
      setHoldings((current) => [
        ...current,
        toInvestment(values, crypto.randomUUID()),
      ]);
      toast.success("Added to this preview only. Nothing was saved.");
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        description="Manual tracking preview. Values are entered by you, not live market prices, and are not saved."
        badge={<StatusBadge label="Preview – not saved" tone="warning" />}
        action={
          <Button type="button" onClick={openAdd}>
            <Plus />
            Add investment
          </Button>
        }
      />

      {holdings.length === 0 ? (
        <EmptyState
          title="No holdings in this preview"
          description="Add an investment to see the layout. It stays in this browser tab only."
          action={
            <Button type="button" onClick={openAdd}>
              <Plus />
              Add investment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {holdings.map((investment) => (
            <Card key={investment.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <CardTitle className="truncate text-lg">{investment.name}</CardTitle>
                  <StatusBadge label={INVESTMENT_TYPE_LABELS[investment.type]} />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${investment.name}`}
                    onClick={() => {
                      setEditing(investment);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${investment.name}`}
                    onClick={() => setRemoving(investment)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Current value (manual)</p>
                  <p className="text-2xl font-semibold">
                    <Money amount={investment.currentValue} />
                  </p>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Amount invested</span>
                  <Money amount={investment.initialAmount} />
                </div>
                {investment.quantity != null ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="tabular-nums text-foreground">
                      {investment.quantity}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Purchased</span>
                  <span className="text-foreground">
                    {formatPurchaseDate(investment.purchaseDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InvestmentFormDialog
        key={editing?.id ?? `new-investment-${formNonce}`}
        open={formOpen}
        investment={editing}
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
        title="Remove this preview holding?"
        description="It will disappear from this page only. Nothing is stored on the server."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) {
            setHoldings((current) =>
              current.filter((item) => item.id !== removing.id),
            );
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
