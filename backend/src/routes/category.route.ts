import { Router } from "express";
import { verifyJWT } from "../middlewares/index";
import {
  createCategory,
  fetchCategories,
  updateCategory,
  archiveCategory,
  restoreCategory,
} from "../controllers/index";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createCategory).get(fetchCategories);

router.route("/:id").put(updateCategory);

router.route("/archive/:id").patch(verifyJWT, archiveCategory);
router.route("/restore/:id").patch(verifyJWT, restoreCategory);

export default router;
