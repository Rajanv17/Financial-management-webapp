import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  fetchUser,
  updateUser,
  deleteUser,
  logoutUser,
} from "../controllers/index";
import { verifyJWT, authRateLimiter } from "../middlewares";

const router = Router();

router.route("/register").post(authRateLimiter, registerUser);
router.route("/login").post(authRateLimiter, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(authRateLimiter, refreshAccessToken);
router.route("/profile").get(verifyJWT, fetchUser);
router.route("/update/:id").patch(verifyJWT, updateUser);
router.route("/delete").delete(verifyJWT, deleteUser);

export default router;
