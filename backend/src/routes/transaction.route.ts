import { Router } from "express";
import {
  createTransaction,
  fetchTransactions,
  updateTransaction,
  deleteTransaction,
} from "../controllers/index";
import { verifyJWT } from "../middlewares/index";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTransaction).get(fetchTransactions);

router.route("/:id").patch(updateTransaction).delete(deleteTransaction);

export default router;
