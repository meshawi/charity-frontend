import { Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import UsersPage from "@/pages/users"
import CategoriesPage from "@/pages/categories"
import ProgramsPage from "@/pages/programs"
import BeneficiariesPage from "@/pages/beneficiaries"
import BeneficiaryDetailPage from "@/pages/beneficiary-detail"
import DisbursementProcessPage from "@/pages/disbursement-process"
import DisbursementsPage from "@/pages/disbursements"
import ReportsPage from "@/pages/reports"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          <Route
            path="/beneficiaries/:id"
            element={<BeneficiaryDetailPage />}
          />
          <Route
            path="/disbursement"
            element={<DisbursementProcessPage />}
          />
          <Route
            path="/disbursements"
            element={<DisbursementsPage />}
          />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
