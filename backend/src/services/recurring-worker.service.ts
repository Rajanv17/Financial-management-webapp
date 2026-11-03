import { prisma } from "../config";
import {
  istMidnight,
  nextOccurrenceAfter,
  todayIST,
} from "../utils/recurrence.util";

export interface ProcessSummary {
  created: number;
  skipped: number;
  alreadyProcessed: number;
  failed: number;
}

async function findDue(today: Date) {
  return prisma.recurringPayment.findMany({
    where: { isActive: true, nextDueDate: { lte: today } },
    include: {
      account: { select: { isArchived: true } },
      category: { select: { isArchived: true } },
    },
    orderBy: { nextDueDate: "asc" },
  });
}
type DuePayment = Awaited<ReturnType<typeof findDue>>[number];

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

/**
 * Processes ONE occurrence atomically. The unique (recurringPaymentId, scheduledFor)
 * constraint on the execution row is the idempotency guard: if another run already
 * handled this date, the insert fails with P2002 and the whole transaction
 * (including the generated Transaction) rolls back.
 */
async function processOccurrence(
  payment: DuePayment,
  scheduledFor: Date,
  next: Date,
): Promise<"created" | "skipped" | "alreadyProcessed"> {
  const blockedReason = payment.account.isArchived
    ? "Account is archived"
    : payment.category.isArchived
      ? "Category is archived"
      : null;
  const ended =
    payment.endDate !== null && next.getTime() > payment.endDate.getTime();

  try {
    await prisma.$transaction(async (tx) => {
      let transactionId: string | null = null;

      if (!blockedReason) {
        const created = await tx.transaction.create({
          data: {
            userId: payment.userId,
            accountId: payment.accountId,
            categoryId: payment.categoryId,
            title: payment.name,
            amount: payment.amount,
            type: payment.type,
            date: istMidnight(scheduledFor),
            description: "Auto-created from recurring payment",
          },
          select: { id: true },
        });
        transactionId = created.id;
      }

      await tx.recurringExecution.create({
        data: {
          recurringPaymentId: payment.id,
          scheduledFor,
          status: blockedReason ? "skipped" : "created",
          transactionId,
          reason: blockedReason,
        },
      });

      await tx.recurringPayment.update({
        where: { id: payment.id },
        data: { nextDueDate: next, ...(ended ? { isActive: false } : {}) },
      });
    });
    return blockedReason ? "skipped" : "created";
  } catch (error) {
    if (isUniqueViolation(error)) return "alreadyProcessed";
    throw error;
  }
}

async function processDueRecurringPayments(
  now: Date = new Date(),
): Promise<ProcessSummary> {
  const today = todayIST(now);
  const summary: ProcessSummary = {
    created: 0,
    skipped: 0,
    alreadyProcessed: 0,
    failed: 0,
  };

  const due = await findDue(today);

  for (const payment of due) {
    try {
      let scheduledFor = payment.nextDueDate;
      // Catch-up loop: handles every missed occurrence up to today.
      while (
        scheduledFor.getTime() <= today.getTime() &&
        (payment.endDate === null ||
          scheduledFor.getTime() <= payment.endDate.getTime())
      ) {
        const next = nextOccurrenceAfter(
          payment.startDate,
          payment.frequency,
          scheduledFor,
        );
        const outcome = await processOccurrence(payment, scheduledFor, next);
        summary[outcome]++;
        scheduledFor = next;
      }
    } catch (error) {
      // One bad payment must not block the rest of the run.
      summary.failed++;
      console.error(`Recurring payment ${payment.id} failed`, error); // swap for your logger
    }
  }

  return summary;
}

export { processDueRecurringPayments };
