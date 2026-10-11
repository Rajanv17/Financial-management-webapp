import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import { sidebarItems } from "./sidebar-config";
import { cn } from "@/lib/utils";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Wallet } from "lucide-react";

function SidebarNavItem({
  label,
  path,
  icon: Icon,
}: {
  label: string;
  path: string;
  icon: React.ElementType;
}) {
  const resolved = useResolvedPath(path);
  const match = useMatch({ path: resolved.pathname, end: true });
  const isActive = !!match;

  return (
    <NavLink to={path} className="block w-full">
      <SidebarMenuItem
        className={cn(
          "relative h-10 w-full",
          isActive && "bg-blue-50 dark:bg-blue-950 rounded-md"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-blue-600" />
        )}

        <SidebarMenuButton asChild>
          <div
            className={cn(
              "flex items-center gap-3 w-full h-10 px-4 rounded-md transition-colors",
              isActive
                ? "text-blue-600 font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </NavLink>
  );
}

export function AppSidebar() {
  return (
    <SidebarRoot collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold h-16 flex items-center gap-3 px-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-md">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold">Finance Manager</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu className="gap-2">
              {sidebarItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  icon={item.icon}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  );
}
