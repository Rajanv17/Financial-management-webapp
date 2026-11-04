export function toISTDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const notificationKeys = {
  recurringDueSoon: (recurringPaymentId: string, scheduledFor: string) =>
    `recurring:${recurringPaymentId}:${scheduledFor}:due_soon`,
  recurringCreated: (recurringPaymentId: string, scheduledFor: string) =>
    `recurring:${recurringPaymentId}:${scheduledFor}:created`,
  recurringSkipped: (recurringPaymentId: string, scheduledFor: string) =>
    `recurring:${recurringPaymentId}:${scheduledFor}:skipped`,
  budgetNearLimit: (budgetId: string) => `budget:${budgetId}:near_limit`,
  budgetExceeded: (budgetId: string) => `budget:${budgetId}:exceeded`,
};
