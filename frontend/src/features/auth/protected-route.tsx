import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth-provider";

function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
