# Architecture Decisions

Short records of why things are built the way they are.
Format: decision, reason, trade-off.

## Data

### PostgreSQL instead of MongoDB

Finance data is relational (users, accounts, categories, transactions, budgets), and foreign keys plus ACID transactions keep references consistent. SQL aggregation powers budget-vs-actual and dashboard totals.
Trade-off: a migration from the original Mongoose models.

### Money is Decimal(12,2), never float

Exact decimals avoid rounding errors. The API returns numbers to the UI, and money math stays on the server.

### Categories and accounts are archived, not deleted

Transactions reference them with `onDelete: Restrict`, so history is never orphaned. Archived items cannot be used for new transactions.

## Budgets

### Monthly-only budgets with IST month boundaries

Simpler than weekly/yearly and enough for the product. Month boundaries are computed in IST (`getMonthRangeIST`), so a transaction at 11 pm on the 30th lands in the right month.

### Budget spend is derived from transactions

`spent` is never stored. Status uses exact paise comparison: `near_limit` from 80%, `exceeded` only when spent > limit.

## Accounts

### Account balance is derived

balance = openingBalance + income - expense, computed in one grouped query. There is no stored balance to drift out of sync.
Trade-off: a grouped query on every account read. Acceptable at this scale.

## Recurring payments

### Simple scheduled worker instead of BullMQ + Redis

The hard parts are idempotency, catch-up and date math, and none of that needs a queue. Redis would be a new service on a free-tier deploy.
Upgrade path: BullMQ + Redis once there is a real need for retries, many workers or rate limiting. The processing function stays the same.

### Idempotency lives in the database

`recurring_executions` has a unique constraint on (recurringPaymentId, scheduledFor). The execution insert, the generated transaction and the `nextDueDate` update share one DB transaction, so a double or concurrent run cannot create duplicates. Covered by a concurrency test.

### Catch-up processing

The worker handles every occurrence with `nextDueDate <= today`, so a missed day is processed on the next run.

### GitHub Actions triggers the worker

Free web services can sleep, so an in-process cron could miss runs. A daily workflow calls `POST /api/internal/recurring/run`, protected by a secret header (fails closed if the secret is unset).
Trade-off: scheduled runs can be delayed by many minutes, so a payment due today is created on the next daily run.

### Occurrences are computed from startDate, not by adding to the previous date

Jan 31 -> Feb 28 -> Mar 28 would drift permanently. `occurrenceAt(start, frequency, n)` clamps to month length, so it returns to the 31st in March.

### Recurring dates are calendar dates (`@db.Date`)

Avoids timezone drift. "Today" is evaluated in IST.

### frequency, startDate and type are immutable

The occurrence math derives from them. To change them, delete and recreate.

### Resume skips occurrences missed during a pause

Back-filling a month of transactions on resume would surprise the user.

### startDate cannot be in the past

Prevents accidental back-filling of old transactions.

### Deleting a recurring payment is a hard delete

Execution history cascades, but transactions it already created stay, because they are real financial records.

### Frequencies limited to weekly, monthly, yearly

Quarterly, custom cron, reminders and "remind only" mode are postponed (reminders belong to the Notifications module).
