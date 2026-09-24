import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, BriefcaseBusiness, FileText, BookMarked, RouteIcon, BookOpen, ClipboardCheck, BrainCircuit, BarChart3, Settings, Menu, Bell, ChevronDown, LogOut, Sparkles
} from "../components/Icons";
import { useAuth } from "../hooks/useAuth";
import { useLanguage, LanguageToggle } from "../contexts/LanguageContext";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const nav = [
    [t("menu_dashboard"), "/admin/dashboard", LayoutDashboard],
    [t("menu_employees"), "/admin/employees", Users],
    [t("menu_departments"), "/admin/departments", Building2],
    [t("menu_job_roles"), "/admin/job-roles", BriefcaseBusiness],
    [t("menu_documents"), "/admin/documents", FileText],
    [t("menu_knowledge_base"), "/admin/knowledge-base", BookMarked],
    [t("menu_onboarding"), "/admin/onboarding", RouteIcon],
    [t("menu_learning"), "/admin/learning-modules", BookOpen],
    [t("menu_quizzes"), "/admin/quizzes", ClipboardCheck],
    [t("menu_ai_studio"), "/admin/ai-studio", BrainCircuit],
    [t("menu_reports"), "/admin/reports", BarChart3],
    [t("menu_settings"), "/admin/settings", Settings],
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar sidebar-admin">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <span>OnboardAI</span>
        </div>
        <div className="role-switcher">
          <span className="role-dot" style={{ background: "#f43f5e" }} />
          <span>{t("role_admin")}</span>
          <ChevronDown size={14} />
        </div>
        <nav className="sidebar-nav" style={{ overflowY: "auto" }}>
          <div className="nav-label">{t("nav_admin")}</div>
          {nav.slice(0, 6).map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
          <div className="nav-label" style={{ marginTop: 8 }}>{t("nav_content")}</div>
          {nav.slice(6, 10).map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
          <div className="nav-label" style={{ marginTop: 8 }}>{t("nav_analytics")}</div>
          {nav.slice(10).map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item nav-button" onClick={handleLogout}><LogOut size={18} /><span>{t("sign_out")}</span></button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setCollapsed(v => !v)}><Menu size={20} /></button>
          <div className="breadcrumbs">
            <span>{t("role_active")}</span><b>/</b>
            <strong>{t("role_admin")}</strong>
          </div>
          <div className="topbar-actions">
            <LanguageToggle />
            <button className="icon-btn notification"><Bell size={19} /><i /></button>
            <div className="profile" onClick={() => setProfileOpen(v => !v)}>
              <div className="avatar" style={{ background: "#ffe4e6", color: "#e11d48" }}>{user?.avatar || "JL"}</div>
              <div className="profile-text">
                <strong>{user?.name || "Jordan Lee"}</strong>
                <span>{user?.role || t("role_admin")}</span>
              </div>
              <ChevronDown size={15} />
              {profileOpen && (
                <div className="profile-menu">
                  <button onClick={() => navigate("/admin/settings")}>{t("menu_settings")}</button>
                  <button onClick={handleLogout}>{t("sign_out")}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
