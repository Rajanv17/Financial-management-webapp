-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('bank', 'cash', 'wallet', 'credit_card', 'other');

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "type" "AccountType" NOT NULL,
    "opening_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "institution_name" VARCHAR(100),
    "color" VARCHAR(9),
    "icon" VARCHAR(50),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_accounts_user_id_idx" ON "financial_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_user_id_name_key" ON "financial_accounts"("user_id", "name");

-- Partial unique index (Prisma cannot express this): one default account per user
CREATE UNIQUE INDEX "financial_accounts_one_default_per_user"
  ON "financial_accounts"("user_id") WHERE "is_default" = true;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: add the column as NULLABLE first
ALTER TABLE "transactions" ADD COLUMN "account_id" UUID;

-- Step 2: one default "Unassigned" account for EVERY user (not only users with transactions)
INSERT INTO "financial_accounts" ("id", "user_id", "name", "type", "is_default", "updated_at")
SELECT gen_random_uuid(), "id", 'Unassigned', 'other', true, CURRENT_TIMESTAMP
FROM "users";

-- Step 3: backfill existing transactions
UPDATE "transactions" t
SET "account_id" = a."id"
FROM "financial_accounts" a
WHERE a."user_id" = t."user_id" AND a."is_default" = true;

-- Step 4: now enforce NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "account_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "transactions_user_id_account_id_date_idx" ON "transactions"("user_id", "account_id", "date");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;