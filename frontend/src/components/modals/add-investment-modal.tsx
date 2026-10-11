import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface AddInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const types = ["Stocks", "Mutual Funds", "Crypto", "Bonds", "Other"];

export function AddInvestmentModal({
  open,
  onOpenChange,
}: AddInvestmentModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Stocks");
  const [initialAmount, setInitialAmount] = useState("0");
  const [currentValue, setCurrentValue] = useState("0");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("11/11/2025");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    // TODO: Handle form submission
    console.log({
      name,
      type,
      initialAmount,
      currentValue,
      quantity,
      purchaseDate,
      notes,
    });
    onOpenChange(false);
    // Reset form
    setName("");
    setType("Stocks");
    setInitialAmount("0");
    setCurrentValue("0");
    setQuantity("");
    setPurchaseDate("11/11/2025");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="investment-name">Investment Name</Label>
            <Input
              id="investment-name"
              placeholder="e.g., Apple Inc., Bitcoin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="investment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-initial">Initial Amount</Label>
            <Input
              id="investment-initial"
              type="number"
              placeholder="0"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-current">Current Value</Label>
            <Input
              id="investment-current"
              type="number"
              placeholder="0"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-quantity">Quantity (Optional)</Label>
            <Input
              id="investment-quantity"
              placeholder="e.g., shares, units"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-date">Purchase Date</Label>
            <div className="relative">
              <Input
                id="investment-date"
                type="text"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                placeholder="11/11/2025"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-notes">Notes (Optional)</Label>
            <Textarea
              id="investment-notes"
              placeholder="Add additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
