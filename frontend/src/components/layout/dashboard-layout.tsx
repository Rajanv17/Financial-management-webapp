import { Outlet, useNavigate } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-gray-50">
          <header className="flex h-14 items-center gap-3 border-b border-gray-200 px-6 bg-white dark:bg-gray-900">
            <SidebarTrigger className="text-black transition-[width] duration-200 dark:text-white" />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1 text-sm transition cursor-pointer hover:bg-gray-100 rounded-lg">
                    <Avatar className="size-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback className="dark:text-white">
                        RV
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
                    onSelect={() => {
                      // TODO: wire real logout
                      navigate("/auth");
                    }}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-900">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
