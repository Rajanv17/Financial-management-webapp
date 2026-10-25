import { Router } from "express";
import { verifyJWT } from "../middlewares/index";
import {
  createAccount,
  fetchAccounts,
  fetchAccountSummary,
  fetchAccountById,
  updateAccount,
  archiveAccount,
  restoreAccount,
} from "../controllers/index";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createAccount).get(fetchAccounts);
router.route("/summary").get(fetchAccountSummary);
router.route("/archive/:id").patch(archiveAccount);
router.route("/restore/:id").patch(restoreAccount);
router.route("/:id").get(fetchAccountById).put(updateAccount);

export default router;
