CREATE UNIQUE INDEX "budgets_user_category_month_year_active_key"
  ON "budgets" ("user_id", "category_id", "month", "year")
  WHERE "is_archived" = false;
