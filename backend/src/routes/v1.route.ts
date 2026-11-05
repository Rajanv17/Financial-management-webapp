import { Router } from "express";
import authRoutes from "./auth.route";
import transactionRoutes from "./transaction.route";
import categoryRoutes from "./category.route";
import budgetRoutes from "./budget.route";
import dashboardRoutes from "./dashboard.route";
import accountRoutes from "./account.route";
import recurringRoutes from "./recurring.route";
import notificationRoutes from "./notification.routes";

const router = Router();

router.use("/user", authRoutes);
router.use("/transactions", transactionRoutes);
router.use("/categories", categoryRoutes);
router.use("/budgets", budgetRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/accounts", accountRoutes);
router.use("/recurring-payments", recurringRoutes);
router.use("/notifications", notificationRoutes);

export default router;
