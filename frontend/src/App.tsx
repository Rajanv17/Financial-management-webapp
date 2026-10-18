import { lazy, Suspense, type ReactNode } from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { PageRouteSkeleton } from "./components/shared/page-route-skeleton";
import { Skeleton } from "./components/ui/skeleton";
import { GuestRoute, ProtectedRoute } from "./features/auth/protected-route";

const AuthPage = lazy(() => import("./pages/auth"));
const OverviewPage = lazy(() => import("./pages/overview"));
const TransactionsPage = lazy(() => import("./pages/transactions/transactions"));
const BudgetPage = lazy(() => import("./pages/budget"));
const RecurringPage = lazy(() => import("./pages/recurring"));
const InvestmentsPage = lazy(() => import("./pages/investments"));
const AnalyticsPage = lazy(() => import("./pages/analytics"));
const ProfilePage = lazy(() => import("./pages/profile"));
const CategoriesPage = lazy(() => import("./pages/categories"));

function AuthFallback() {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6">
      <Skeleton className="h-80 w-full max-w-sm" />
    </div>
  );
}

function withPageSuspense(page: ReactNode) {
  return <Suspense fallback={<PageRouteSkeleton />}>{page}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<GuestRoute />}>
        <Route
          path="/auth"
          element={
            <Suspense fallback={<AuthFallback />}>
              <AuthPage />
            </Suspense>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={withPageSuspense(<OverviewPage />)} />
          <Route
            path="transactions"
            element={withPageSuspense(<TransactionsPage />)}
          />
          <Route
            path="categories"
            element={withPageSuspense(<CategoriesPage />)}
          />
          <Route path="budget" element={withPageSuspense(<BudgetPage />)} />
          <Route
            path="recurring"
            element={withPageSuspense(<RecurringPage />)}
          />
          <Route
            path="investments"
            element={withPageSuspense(<InvestmentsPage />)}
          />
          <Route
            path="analytics"
            element={withPageSuspense(<AnalyticsPage />)}
          />
          <Route path="profile" element={withPageSuspense(<ProfilePage />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
