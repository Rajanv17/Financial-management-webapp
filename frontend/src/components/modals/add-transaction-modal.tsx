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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Salary",
  "Other",
];

export function AddTransactionModal({
  open,
  onOpenChange,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState("11/11/2025");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    // TODO: Handle form submission
    console.log({ type, title, amount, category, date, description });
    onOpenChange(false);
    // Reset form
    setTitle("");
    setAmount("0.00");
    setCategory("other");
    setDate("11/11/2025");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>

        {/* Type Selection */}
        {/* <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setType("expense")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              type === "expense"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setType("income")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              type === "income"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Income
          </button>
        </div> */}
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(value) =>
            value && setType(value as "expense" | "income")
          }
          className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full mb-2"
        >
          <ToggleGroupItem
            value="expense"
            className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
          >
            Expense
          </ToggleGroupItem>

          <ToggleGroupItem
            value="income"
            className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
          >
            Income
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Input
                id="date"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="11/11/2025"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note..."
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
            Save transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
