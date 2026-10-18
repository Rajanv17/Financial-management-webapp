import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddBudgetModal } from "@/components/modals/add-budget-modal";

export default function BudgetPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground pt-2">
            Track your spending limits.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      <AddBudgetModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Overall Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">₹850.00 of ₹1000.00</span>
              <span className="text-sm text-muted-foreground">85% used</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            name: "Food",
            spent: 450,
            total: 500,
            color: "orange",
            colorClass: "text-orange-600",
            bgColorClass: "bg-orange-600",
          },
          {
            name: "Transport",
            spent: 180,
            total: 300,
            color: "blue",
            colorClass: "text-blue-600",
            bgColorClass: "bg-blue-600",
          },
          {
            name: "Entertainment",
            spent: 220,
            total: 200,
            color: "purple",
            colorClass: "text-purple-600",
            bgColorClass: "bg-purple-600",
          },
        ].map((budget) => {
          const percentage = (budget.spent / budget.total) * 100;
          const isOver = budget.spent > budget.total;
          return (
            <Card key={budget.name} className="border-none shadow-md">
              <CardHeader>
                <CardTitle className={`text-xl font-bold ${budget.colorClass}`}>
                  {budget.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">monthly</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ₹{budget.spent.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ₹{budget.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        isOver ? "bg-red-600" : budget.bgColorClass
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        isOver ? "text-red-600" : "text-muted-foreground"
                      }
                    >
                      {percentage.toFixed(0)}% used
                    </span>
                    <span
                      className={
                        isOver ? "text-red-600" : "text-muted-foreground"
                      }
                    >
                      {isOver
                        ? `₹${Math.abs(budget.total - budget.spent).toFixed(
                            2
                          )} over`
                        : `₹${(budget.total - budget.spent).toFixed(2)} left`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
