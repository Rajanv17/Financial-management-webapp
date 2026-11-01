import { Router } from "express";
import {
  createBudget,
  copyBudgets,
  fetchBudgets,
  fetchBudgetSummary,
  updateBudget,
  archiveBudget,
  restoreBudget,
} from "../controllers/index";
import { verifyJWT } from "../middlewares/index";

const router = Router();

router.use(verifyJWT);

router.route("/summary").get(fetchBudgetSummary);
router.route("/copy").post(copyBudgets);
router.route("/").post(createBudget).get(fetchBudgets);

router.route("/:id").patch(updateBudget).delete(archiveBudget);
router.route("/:id/restore").patch(restoreBudget);

export default router;
