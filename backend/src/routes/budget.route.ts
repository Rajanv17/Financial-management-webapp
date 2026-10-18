import { Router } from "express";
import {
  createBudget,
  fetchBudgets,
  fetchBudgetSummary,
  updateBudget,
  archiveBudget,
} from "../controllers/index";
import { verifyJWT } from "../middlewares/index";

const router = Router();

router.use(verifyJWT);

router.route("/summary").get(fetchBudgetSummary);
router.route("/").post(createBudget).get(fetchBudgets);

router.route("/:id").patch(updateBudget).delete(archiveBudget);

export default router;
