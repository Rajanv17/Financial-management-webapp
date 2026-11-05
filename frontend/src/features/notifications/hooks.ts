import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: () => [...notificationKeys.all, "unread-count"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: fetchUnreadCount,
    select: (d) => d.unreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => fetchNotifications(10),
    enabled,
  });

function useNotificationMutation<TVars, TData>(
  fn: (vars: TVars) => Promise<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export const useMarkRead = () => useNotificationMutation(markNotificationRead);
export const useMarkAllRead = () =>
  useNotificationMutation(markAllNotificationsRead);
