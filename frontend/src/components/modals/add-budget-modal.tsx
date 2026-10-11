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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface AddBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Food & Dining",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Other",
];

const periods = ["Monthly", "Weekly", "Yearly"];

export function AddBudgetModal({ open, onOpenChange }: AddBudgetModalProps) {
  const [category, setCategory] = useState("Food & Dining");
  const [amount, setAmount] = useState("0");
  const [period, setPeriod] = useState("Monthly");
  const [startDate, setStartDate] = useState("11/11/2025");

  const handleSubmit = () => {
    // TODO: Handle form submission
    console.log({ category, amount, period, startDate });
    onOpenChange(false);
    // Reset form
    setCategory("Food & Dining");
    setAmount("0");
    setPeriod("Monthly");
    setStartDate("11/11/2025");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Budget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="budget-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount">Budget Amount</Label>
            <Input
              id="budget-amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-period">Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="budget-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-date">Start Date</Label>
            <div className="relative">
              <Input
                id="budget-date"
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="11/11/2025"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
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
            Add Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
