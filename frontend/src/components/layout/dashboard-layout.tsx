import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { userInitials } from "@/lib/format";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, UserIcon, LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = userInitials(user?.username ?? "");

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-background">
          <header className="flex h-14 items-center gap-3 border-b border-border px-6 bg-card">
            <SidebarTrigger className="hidden text-foreground transition-[width] duration-200 md:inline-flex" />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1 text-sm transition cursor-pointer hover:bg-accent rounded-lg">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => navigate("/dashboard/profile")}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await logout();
                      } catch {
                        toast.error("Could not sign out. Try again.");
                      }
                    }}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-6">
            <Outlet />
          </main>
          <MobileBottomNav />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
