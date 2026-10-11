import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import { AddPaymentModal } from "@/components/modals/add-payment-modal";

const recurringPayments = [
  {
    id: "1",
    title: "Netflix Subscription",
    amount: 15.99,
    frequency: "monthly",
    nextDue: "Feb 1, 2024",
    category: "Entertainment",
  },
  {
    id: "2",
    title: "Rent",
    amount: 1200.0,
    frequency: "monthly",
    nextDue: "Feb 1, 2024",
    category: "Utilities",
  },
  {
    id: "3",
    title: "Gym Membership",
    amount: 50.0,
    frequency: "monthly",
    nextDue: "Feb 5, 2024",
    category: "Health",
  },
];

const categoryColors: Record<string, string> = {
  Entertainment: "bg-purple-100 text-purple-700",
  Utilities: "bg-orange-100 text-orange-700",
  Health: "bg-green-100 text-green-700",
};

export default function RecurringPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const totalMonthly = recurringPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Recurring Payments
          </h1>
          <p className="text-muted-foreground pt-2">
            Manage your subscriptions and bills.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      <AddPaymentModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {/* Total Summary */}
      <Card className="border-none bg-white shadow-md">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-4xl font-bold">₹{totalMonthly.toFixed(2)}</p>
            <p className="text-muted-foreground mt-2">per month</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total recurring payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Payment Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {recurringPayments.map((payment) => (
          <Card
            key={payment.id}
            className="border-none bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold">
                    {payment.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{payment.amount.toFixed(2)} / {payment.frequency}
                  </p>
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Next: {payment.nextDue}
                  </span>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      categoryColors[payment.category] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {payment.category}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
