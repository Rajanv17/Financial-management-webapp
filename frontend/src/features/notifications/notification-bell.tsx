import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "./hooks";
import { timeAgo } from "./format";
import type { AppNotification, NotificationType } from "./types";

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; tone: string; href: string }
> = {
  recurring_due_soon: {
    icon: CalendarClock,
    tone: "text-amber-600",
    href: "/dashboard/recurring",
  },
  recurring_created: {
    icon: CircleCheck,
    tone: "text-emerald-600",
    href: "/dashboard/recurring",
  },
  recurring_skipped: {
    icon: CircleSlash,
    tone: "text-muted-foreground",
    href: "/dashboard/recurring",
  },
  budget_near_limit: {
    icon: AlertTriangle,
    tone: "text-amber-600",
    href: "/dashboard/budget",
  },
  budget_exceeded: {
    icon: AlertTriangle,
    tone: "text-destructive",
    href: "/dashboard/budget",
  },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const list = useNotifications(open);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  const handleSelect = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    navigate(TYPE_META[n.type].href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white"
            >
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Notifications
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {list.isPending ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Could not load notifications.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => list.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : list.data.items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul>
              {list.data.items.map((n) => {
                const { icon: Icon, tone } = TYPE_META[n.type];
                const unread = n.readAt === null;
                return (
                  <li
                    key={n.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(n)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                        unread && "bg-primary/5",
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm text-foreground",
                            unread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {unread && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
