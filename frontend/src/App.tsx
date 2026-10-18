import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { GuestRoute, ProtectedRoute } from "./features/auth/protected-route";
import AuthPage from "./pages/auth";
import OverviewPage from "./pages/overview";
import TransactionsPage from "./pages/transactions/transactions";
import BudgetPage from "./pages/budget";
import RecurringPage from "./pages/recurring";
import InvestmentsPage from "./pages/investments";
import AnalyticsPage from "./pages/analytics";
import ProfilePage from "./pages/profile";
import CategoriesPage from "./pages/categories";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
