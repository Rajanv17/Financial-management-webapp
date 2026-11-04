import { Router } from "express";

import { verifyJWT } from "../middlewares";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers";

const router = Router();

router.use(verifyJWT);

router.route("/").get(fetchNotifications);
router.route("/unread-count").get(fetchUnreadCount);
router.route("/read-all").patch(markAllNotificationsRead);
router.route("/:id/read").patch(markNotificationRead);

export default router;
