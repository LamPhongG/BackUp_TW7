import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { DocumentsProvider } from "./contexts/DocumentsContext";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Employee pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import OnboardingPlan from "./pages/employee/OnboardingPlan";
import LearningModules from "./pages/employee/LearningModules";
import ModuleDetail from "./pages/employee/ModuleDetail";
import Quiz from "./pages/employee/Quiz";
import EmployeeTasks from "./pages/employee/Tasks";
import Checklist from "./pages/employee/Checklist";
import EmployeeDocuments from "./pages/employee/Documents";
import Profile from "./pages/employee/Profile";

// Manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import Team from "./pages/manager/Team";
import EmployeeDetail from "./pages/manager/EmployeeDetail";
import ManagerTasks from "./pages/manager/Tasks";
import Reviews from "./pages/manager/Reviews";
import ManagerReports from "./pages/manager/Reports";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import Departments from "./pages/admin/Departments";
import JobRoles from "./pages/admin/JobRoles";
import AdminDocuments from "./pages/admin/Documents";
import KnowledgeBase from "./pages/admin/KnowledgeBase";
import Onboarding from "./pages/admin/Onboarding";
import AdminLearningModules from "./pages/admin/LearningModules";
import Quizzes from "./pages/admin/Quizzes";
import AIStudio from "./pages/admin/AIStudio";
import AdminReports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="page-empty">
      <div style={{ textAlign: "center" }}>
        <div className="empty-icon">404</div>
        <h2>{t("page_not_found")}</h2>
        <p style={{ color: "var(--muted)" }}>{t("page_not_found_desc")}</p>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuthProvider();

  return (
    <LanguageProvider>
      <AuthContext.Provider value={auth}>
        <DocumentsProvider>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Employee routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="onboarding" element={<OnboardingPlan />} />
            <Route path="learning" element={<LearningModules />} />
            <Route path="learning/:id" element={<ModuleDetail />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="checklist" element={<Checklist />} />
            <Route path="documents" element={<EmployeeDocuments />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Manager routes */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="team" element={<Team />} />
            <Route path="team/:id" element={<EmployeeDetail />} />
            <Route path="tasks" element={<ManagerTasks />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="departments" element={<Departments />} />
            <Route path="job-roles" element={<JobRoles />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="learning-modules" element={<AdminLearningModules />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="ai-studio" element={<AIStudio />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Default redirect */}
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </DocumentsProvider>
      </AuthContext.Provider>
    </LanguageProvider>
  );
}