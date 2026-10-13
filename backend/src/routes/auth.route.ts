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
import { verifyJWT } from "../middlewares";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/profile").get(verifyJWT, fetchUser);
router.route("/update/:id").patch(verifyJWT, updateUser);
router.route("/delete").delete(verifyJWT, deleteUser);

export default router;
