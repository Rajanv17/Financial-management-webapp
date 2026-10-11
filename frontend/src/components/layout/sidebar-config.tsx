import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  RefreshCw,
  TrendingUp,
  BarChart3,
  User,
  LogOut,
  Tag,
} from "lucide-react";

export const sidebarItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    path: "/dashboard/transactions",
  },
  {
    label: "Categories",
    icon: Tag,
    path: "/dashboard/categories",
  },
  {
    label: "Budget",
    icon: Wallet,
    path: "/dashboard/budget",
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
];

export const logoutItem = {
  label: "Logout",
  icon: LogOut,
  path: "/logout",
};
