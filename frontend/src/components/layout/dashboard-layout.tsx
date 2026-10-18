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
        <div className="flex min-h-svh min-w-0 flex-col bg-background">
          <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
            <SidebarTrigger className="text-foreground transition-[width] duration-200" />
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex max-w-[40vw] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
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

          <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 pb-24 md:px-5 md:py-5 md:pb-6 xl:px-7 xl:py-7">
            <Outlet />
          </main>
          <MobileBottomNav />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
