import { Router } from "express";
import { verifyJWT } from "../middlewares/index"; // match your account route
import {
  createRecurringPayment,
  deleteRecurringPayment,
  fetchExecutions,
  fetchRecurringPaymentById,
  fetchRecurringPayments,
  pauseRecurringPayment,
  resumeRecurringPayment,
  updateRecurringPayment,
} from "../controllers/recurring.controller";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createRecurringPayment);
router.route("/").get(fetchRecurringPayments);
router.route("/:id").get(fetchRecurringPaymentById);
router.route("/:id").patch(updateRecurringPayment);
router.route("/:id/pause").patch(pauseRecurringPayment);
router.route("/:id/resume").patch(resumeRecurringPayment);
router.route("/:id").delete(deleteRecurringPayment);
router.route("/:id/executions").get(fetchExecutions);

export default router;
