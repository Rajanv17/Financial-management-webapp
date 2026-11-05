export type NotificationType =
  | "recurring_due_soon"
  | "recurring_created"
  | "recurring_skipped"
  | "budget_near_limit"
  | "budget_exceeded";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = {
  items: AppNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
