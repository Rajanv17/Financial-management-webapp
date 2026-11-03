import { Router } from "express";
import v1 from "./v1.route";
import internalRoutes from "./internal.route";

const router = Router();

router.use("/v1", v1);
router.use("/internal", internalRoutes);

export default router;
