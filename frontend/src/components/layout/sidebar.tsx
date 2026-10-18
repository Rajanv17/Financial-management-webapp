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
      <SidebarMenuItem className="relative h-10 w-full">
        <SidebarMenuButton
          asChild
          className={cn(
            "flex items-center gap-3 w-full h-10 px-4 rounded-md transition-colors",
            isActive
              ? "bg-primary! text-primary-foreground! font-medium hover:bg-primary! hover:text-primary-foreground! active:bg-primary! active:text-primary-foreground!"
              : "text-sidebar-foreground"
          )}
        >
          <div>
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
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg shadow-md">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              Finance Manager
            </span>
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
