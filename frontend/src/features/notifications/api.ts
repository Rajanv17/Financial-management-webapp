import { api } from "@/lib/api";
import type { AppNotification, NotificationPage } from "./types";

const BASE = "/notifications";

export const fetchNotifications = (limit = 10) =>
  api<NotificationPage>(`${BASE}?limit=${limit}`);

export const fetchUnreadCount = () =>
  api<{ unreadCount: number }>(`${BASE}/unread-count`);

export const markNotificationRead = (id: string) =>
  api<AppNotification>(`${BASE}/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  api<{ updated: number }>(`${BASE}/read-all`, { method: "PATCH" });
