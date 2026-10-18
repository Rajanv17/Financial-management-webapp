import { Router } from "express";
import authRoutes from "./auth.route";
import transactionRoutes from "./transaction.route";
import categoryRoutes from "./category.route";
import budgetRoutes from "./budget.route";
import dashboardRoutes from "./dashboard.route";

const router = Router();

router.use("/user", authRoutes);
router.use("/transactions", transactionRoutes);
router.use("/categories", categoryRoutes);
router.use("/budgets", budgetRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
