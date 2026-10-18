import { Router } from "express";
import { fetchDashboardSummary } from "../controllers/index";
import { verifyJWT } from "../middlewares/index";

const router = Router();

router.use(verifyJWT);

router.route("/summary").get(fetchDashboardSummary);

export default router;
