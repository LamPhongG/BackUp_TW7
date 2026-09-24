import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, RouteIcon, BookOpen, ClipboardCheck, CheckSquare,
  FileText, Menu, Bell, ChevronDown, Settings, LogOut, Sparkles
} from "../components/Icons";
import { useAuth } from "../hooks/useAuth";
import { useLanguage, LanguageToggle } from "../contexts/LanguageContext";

export default function EmployeeLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const nav = [
    [t("menu_dashboard"), "/employee/dashboard", LayoutDashboard],
    [t("menu_onboarding"), "/employee/onboarding", RouteIcon],
    [t("menu_learning"), "/employee/learning", BookOpen],
    [t("menu_quiz"), "/employee/quiz", ClipboardCheck],
    [t("menu_tasks"), "/employee/tasks", CheckSquare],
    [t("menu_documents"), "/employee/documents", FileText],
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <span>OnboardAI</span>
        </div>
        <div className="role-switcher">
          <span className="role-dot" />
          <span>{t("role_employee")}</span>
          <ChevronDown size={14} />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">{t("nav_workspace")}</div>
          {nav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/employee/profile" className="nav-item"><Settings size={18} /><span>{t("menu_profile")}</span></NavLink>
          <button className="nav-item nav-button" onClick={handleLogout}><LogOut size={18} /><span>{t("sign_out")}</span></button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setCollapsed(v => !v)}><Menu size={20} /></button>
          <div className="breadcrumbs">
            <span>{t("role_active")}</span><b>/</b>
            <strong>{t("role_employee")}</strong>
          </div>
          <div className="topbar-actions">
            <LanguageToggle />
            <button className="icon-btn notification"><Bell size={19} /><i /></button>
            <div className="profile" onClick={() => setProfileOpen(v => !v)}>
              <div className="avatar">{user?.avatar || "AM"}</div>
              <div className="profile-text">
                <strong>{user?.name || "Alex Morgan"}</strong>
                <span>{user?.role || t("role_employee")}</span>
              </div>
              <ChevronDown size={15} />
              {profileOpen && (
                <div className="profile-menu">
                  <button onClick={() => navigate("/employee/profile")}>{t("my_profile")}</button>
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
