import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { processDueRecurringPayments } from "../services/recurring-worker.service";

function secretMatches(
  provided: string | undefined,
  expected: string,
): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function runRecurringPayments(req: Request, res: Response) {
  // Read at request time so tests can set it. Fail closed if it is missing or weak.
  const expected = process.env.RECURRING_CRON_SECRET;
  if (!expected || expected.length < 16) {
    return res
      .status(503)
      .json({ message: "Recurring runner is not configured" });
  }

  if (!secretMatches(req.header("x-cron-secret"), expected)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const summary = await processDueRecurringPayments();
  return res
    .status(200)
    .json({ message: "Recurring payments processed", data: summary });
}

export { runRecurringPayments };
