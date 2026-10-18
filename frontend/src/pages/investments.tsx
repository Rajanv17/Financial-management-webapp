import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { AddInvestmentModal } from "@/components/modals/add-investment-modal";

const investments = [
  {
    id: "1",
    name: "Reliance Industries",
    type: "stocks",
    currentValue: 6200,
    initialAmount: 5000,
    quantity: 40,
    purchaseDate: "Jun 2023",
    gain: 1200,
    gainPercent: 24.0,
  },
  {
    id: "2",
    name: "HDFC Mutual Fund",
    type: "mutual funds",
    currentValue: 11500,
    initialAmount: 10000,
    purchaseDate: "Jan 2023",
    gain: 1500,
    gainPercent: 15.0,
  },
  {
    id: "3",
    name: "Bitcoin",
    type: "crypto",
    currentValue: 3800,
    initialAmount: 3000,
    quantity: 0.15,
    purchaseDate: "Aug 2023",
    gain: 800,
    gainPercent: 26.67,
  },
];

const typeColors: Record<string, string> = {
  stocks: "bg-blue-100 text-blue-700",
  "mutual funds": "bg-orange-100 text-orange-700",
  crypto: "bg-purple-100 text-purple-700",
};

export default function InvestmentsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.initialAmount,
    0
  );
  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  );
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = (totalGain / totalInvested) * 100;

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground pt-2">
            Track your portfolio performance.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Investment
        </Button>
      </div>

      <AddInvestmentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹{totalInvested.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Total Gain/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              +₹{totalGain.toLocaleString()} ({totalGainPercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {investments.map((investment) => (
          <Card
            key={investment.id}
            className="border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold">
                    {investment.name}
                  </CardTitle>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                      typeColors[investment.type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {investment.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    ₹{investment.currentValue.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial:</span>
                    <span className="font-medium">
                      ₹{investment.initialAmount.toLocaleString()}
                    </span>
                  </div>
                  {investment.quantity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{investment.quantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased:</span>
                    <span className="font-medium">
                      {investment.purchaseDate}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">
                      +₹{investment.gain.toLocaleString()} (
                      {investment.gainPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
