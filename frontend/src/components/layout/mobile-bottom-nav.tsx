import { useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  BarChart3,
  Landmark,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Tag,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

const PRIMARY_ITEMS = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    path: "/dashboard/transactions",
  },
  {
    label: "Budget",
    icon: Wallet,
    path: "/dashboard/budget",
  },
] as const;

const MORE_ITEMS = [
  {
    label: "Categories",
    icon: Tag,
    path: "/dashboard/categories",
  },
  {
    label: "Accounts",
    icon: Landmark,
    path: "/dashboard/accounts",
  },
  {
    label: "Recurring",
    icon: RefreshCw,
    path: "/dashboard/recurring",
  },
  {
    label: "Investments",
    icon: TrendingUp,
    path: "/dashboard/investments",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/dashboard/analytics",
  },
  {
    label: "Profile",
    icon: User,
    path: "/dashboard/profile",
  },
] as const;

const itemClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "text-primary" : "text-muted-foreground",
  );

export function MobileBottomNav() {
  const location = useLocation();
  const { logout } = useAuth();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  const onSignOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Could not sign out. Try again.");
    }
  };

  return (
    <Sheet>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex items-stretch">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={itemClassName}
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
          <SheetTrigger asChild>
            <button
              ref={moreButtonRef}
              type="button"
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs focus-visible:ring-2 focus-visible:ring-ring",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">More</span>
            </button>
          </SheetTrigger>
        </div>
      </nav>
      <SheetContent
        side="bottom"
        className="gap-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          moreButtonRef.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>
            Additional pages, theme, and account
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="More" className="flex flex-col gap-1 px-2">
          {MORE_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SheetClose asChild key={item.path}>
                <NavLink
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </SheetClose>
            );
          })}
        </nav>
        <SheetFooter className="gap-3">
          <div className="flex min-h-11 items-center justify-between rounded-md px-3">
            <span className="text-sm text-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <SheetClose asChild>
            <button
              type="button"
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => void onSignOut()}
            >
              <LogOut className="size-5 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
