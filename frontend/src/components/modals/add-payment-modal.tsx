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

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Utilities",
  "Entertainment",
  "Health",
  "Transport",
  "Shopping",
  "Other",
];

const frequencies = ["Monthly", "Weekly", "Yearly"];

export function AddPaymentModal({ open, onOpenChange }: AddPaymentModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("Utilities");
  const [frequency, setFrequency] = useState("Monthly");
  const [nextDueDate, setNextDueDate] = useState("11/11/2025");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    // TODO: Handle form submission
    console.log({
      title,
      amount,
      category,
      frequency,
      nextDueDate,
      description,
    });
    onOpenChange(false);
    // Reset form
    setTitle("");
    setAmount("0");
    setCategory("Utilities");
    setFrequency("Monthly");
    setNextDueDate("11/11/2025");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Recurring Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-title">Title</Label>
            <Input
              id="payment-title"
              placeholder="e.g., Netflix Subscription"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="payment-category">
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
            <Label htmlFor="payment-frequency">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="payment-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Next Due Date</Label>
            <div className="relative">
              <Input
                id="payment-date"
                type="text"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                placeholder="11/11/2025"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-description">Description (Optional)</Label>
            <Textarea
              id="payment-description"
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
