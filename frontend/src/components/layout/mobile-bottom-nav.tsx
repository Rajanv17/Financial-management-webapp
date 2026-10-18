import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

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

function BottomNavItem({
  label,
  path,
  icon: Icon,
}: {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}) {
  const resolved = useResolvedPath(path);
  const match = useMatch({ path: resolved.pathname, end: true });
  const isActive = !!match;

  return (
    <NavLink
      to={path}
      className={cn(
        "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function MobileBottomNav() {
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex items-stretch">
        {PRIMARY_ITEMS.map((item) => (
          <BottomNavItem key={item.path} {...item} />
        ))}
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          <span className="truncate">More</span>
        </button>
      </div>
    </nav>
  );
}
