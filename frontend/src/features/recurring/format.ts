import type { RecurringPayment } from "./types";

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

// Inactive and past its end date: the worker deactivated it, it cannot be resumed.
export const hasEnded = (p: RecurringPayment) =>
  !p.isActive && p.endDate !== null && p.nextDueDate > p.endDate;

export type DueTone = "neutral" | "warning" | "danger";

export const dueInfo = (
  nextDueDate: string,
): { text: string; tone: DueTone } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${nextDueDate}T00:00:00`);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return { text: "Overdue", tone: "danger" };
  if (days === 0) return { text: "Due today", tone: "warning" };
  if (days === 1) return { text: "Due tomorrow", tone: "warning" };
  if (days <= 7) {
    return {
      text: `Due in ${days} days`,
      tone: days <= 3 ? "warning" : "neutral",
    };
  }
  return { text: `Due ${formatDate(nextDueDate)}`, tone: "neutral" };
};
