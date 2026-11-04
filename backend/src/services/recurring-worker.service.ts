import { prisma } from "../config";
import {
  istMidnight,
  nextOccurrenceAfter,
  todayIST,
} from "../utils/recurrence.util";
import { notificationKeys } from "../utils";
import {
  dateOnlyKey,
  formatDisplayDate,
  formatInr,
} from "../utils/notificationMessages";
import { createNotification } from "./notification.service";

const REMINDER_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ProcessSummary {
  created: number;
  skipped: number;
  alreadyProcessed: number;
  failed: number;
  remindersCreated: number;
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
 * (including the generated Transaction and the notification) rolls back.
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
  const dateKey = dateOnlyKey(scheduledFor);

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

      const amount = formatInr(payment.amount);
      const when = formatDisplayDate(scheduledFor);
      const data = {
        recurringPaymentId: payment.id,
        scheduledFor: dateKey,
        transactionId,
      };

      if (blockedReason) {
        await createNotification(
          {
            userId: payment.userId,
            type: "recurring_skipped",
            title: `${payment.name} was skipped`,
            message: `${payment.name} (${amount}) for ${when} was skipped: ${blockedReason}.`,
            dedupeKey: notificationKeys.recurringSkipped(payment.id, dateKey),
            data,
          },
          tx,
        );
      } else {
        await createNotification(
          {
            userId: payment.userId,
            type: "recurring_created",
            title: `${payment.name} was recorded`,
            message: `${payment.name} (${amount}) for ${when} was added as ${
              payment.type === "expense" ? "an expense" : "income"
            }.`,
            dedupeKey: notificationKeys.recurringCreated(payment.id, dateKey),
            data,
          },
          tx,
        );
      }

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

/**
 * "Rent is due in N days" for expenses whose next due date falls inside the
 * reminder window. One notification per (payment, due date), however many
 * times the job runs.
 */
async function createDueSoonReminders(today: Date): Promise<number> {
  const horizon = new Date(today.getTime() + REMINDER_DAYS * MS_PER_DAY);

  const upcoming = await prisma.recurringPayment.findMany({
    where: {
      isActive: true,
      type: "expense",
      nextDueDate: { gt: today, lte: horizon },
      account: { isArchived: false },
      category: { isArchived: false },
    },
    select: {
      id: true,
      userId: true,
      name: true,
      amount: true,
      nextDueDate: true,
      endDate: true,
    },
  });

  let created = 0;
  for (const p of upcoming) {
    if (p.endDate && p.nextDueDate.getTime() > p.endDate.getTime()) continue;

    const days = Math.round(
      (p.nextDueDate.getTime() - today.getTime()) / MS_PER_DAY,
    );
    const dateKey = dateOnlyKey(p.nextDueDate);
    const inDays = days === 1 ? "tomorrow" : `in ${days} days`;

    const isNew = await createNotification({
      userId: p.userId,
      type: "recurring_due_soon",
      title: `${p.name} is due ${inDays}`,
      message: `${p.name} (${formatInr(p.amount)}) is due on ${formatDisplayDate(p.nextDueDate)}.`,
      dedupeKey: notificationKeys.recurringDueSoon(p.id, dateKey),
      data: { recurringPaymentId: p.id, dueDate: dateKey },
    });
    if (isNew) created++;
  }
  return created;
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
    remindersCreated: 0,
  };

  const due = await findDue(today);

  for (const payment of due) {
    try {
      let scheduledFor = payment.nextDueDate;
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
      summary.failed++;
      console.error(`Recurring payment ${payment.id} failed`, error);
    }
  }

  try {
    summary.remindersCreated = await createDueSoonReminders(today);
  } catch (error) {
    console.error("Due-soon reminders failed", error);
  }

  return summary;
}

export { processDueRecurringPayments };
