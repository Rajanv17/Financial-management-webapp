import { Router } from "express";
import { runRecurringPayments } from "../controllers/recurring-internal.controller";

const router = Router();
router.route("/recurring/run").post(runRecurringPayments);

export default router;
