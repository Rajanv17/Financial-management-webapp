-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('created', 'skipped');

-- CreateTable
CREATE TABLE "recurring_payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL,
    "start_date" DATE NOT NULL,
    "next_due_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recurring_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_executions" (
    "id" UUID NOT NULL,
    "recurring_payment_id" UUID NOT NULL,
    "scheduled_for" DATE NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "transaction_id" UUID,
    "reason" VARCHAR(200),
    "executed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_payments_is_active_next_due_date_idx" ON "recurring_payments"("is_active", "next_due_date");

-- CreateIndex
CREATE INDEX "recurring_payments_user_id_idx" ON "recurring_payments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_executions_transaction_id_key" ON "recurring_executions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_executions_recurring_payment_id_scheduled_for_key" ON "recurring_executions"("recurring_payment_id", "scheduled_for");

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_executions" ADD CONSTRAINT "recurring_executions_recurring_payment_id_fkey" FOREIGN KEY ("recurring_payment_id") REFERENCES "recurring_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_payments"
  ADD CONSTRAINT "recurring_payments_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "recurring_payments"
  ADD CONSTRAINT "recurring_payments_end_after_start"
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date");
