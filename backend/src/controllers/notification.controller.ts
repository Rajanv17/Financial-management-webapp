import { Response } from "express";
import { prisma } from "../config";
import { AuthenticatedRequest } from "../middlewares";
import {
  ApiError,
  ApiResponse,
  optionalQueryString,
  parseIntInRange,
  requireId,
} from "../utils";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");
  return userId;
};

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  readAt: true,
  createdAt: true,
} as const;

const fetchNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);

  const pageValue = optionalQueryString(req.query.page, "page");
  const limitValue = optionalQueryString(req.query.limit, "limit");
  const page =
    pageValue === undefined
      ? 1
      : parseIntInRange(pageValue, "page", 1, 1_000_000);
  const limit =
    limitValue === undefined
      ? 20
      : parseIntInRange(limitValue, "limit", 1, 100);

  const unreadParam = optionalQueryString(req.query.unread, "unread");
  if (
    unreadParam !== undefined &&
    unreadParam !== "true" &&
    unreadParam !== "false"
  ) {
    throw new ApiError(400, "unread must be true or false");
  }

  const where = {
    userId,
    ...(unreadParam === "true" && { readAt: null }),
  };

  const [total, items, unreadCount] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: NOTIFICATION_SELECT,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Notifications fetched successfully",
    ),
  );
};

const fetchUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { unreadCount },
        "Unread count fetched successfully",
      ),
    );
};

const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const id = requireId(req.params.id, "Notification id");

  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: NOTIFICATION_SELECT,
  });
  if (!notification) throw new ApiError(404, "Notification not found");

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
};

const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = requireUserId(req);
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updated: count },
        "All notifications marked as read",
      ),
    );
};

export {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
