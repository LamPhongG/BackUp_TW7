import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CheckSquare, BarChart3, ClipboardList,
  Menu, Bell, ChevronDown, LogOut, Sparkles
} from "../components/Icons";
import { useAuth } from "../hooks/useAuth";
import { useLanguage, LanguageToggle } from "../contexts/LanguageContext";

// [locale key, path, icon] — key cũng dùng cho breadcrumb
const NAV = [
  ["menu_dashboard", "/manager/dashboard", LayoutDashboard],
  ["menu_team", "/manager/team", Users],
  ["menu_tasks", "/manager/tasks", CheckSquare],
  ["menu_reviews", "/manager/reviews", ClipboardList],
  ["menu_reports", "/manager/reports", BarChart3],
];

export default function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const section = location.pathname.split("/")[2] || "dashboard";
  const currentNav = NAV.find(([, to]) => to === `/manager/${section}`);
  const breadcrumb = currentNav ? t(currentNav[0]) : section;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar sidebar-manager">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <span>OnboardAI</span>
        </div>
        <div className="role-switcher">
          <span className="role-dot" style={{ background: "#f59e0b" }} />
          <span>{t("role_manager")}</span>
          <ChevronDown size={14} />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">{t("nav_manager_workspace")}</div>
          {NAV.map(([key, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{t(key)}</span>
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
            <span>{t("role_manager")}</span><b>/</b>
            <strong>{breadcrumb}</strong>
          </div>
          <div className="topbar-actions">
            <LanguageToggle />
            <button className="icon-btn notification"><Bell size={19} /><i /></button>
            <div className="profile" onClick={() => setProfileOpen(v => !v)}>
              <div className="avatar" style={{ background: "#fef3c7", color: "#d97706" }}>{user?.avatar || "SC"}</div>
              <div className="profile-text">
                <strong>{user?.name || "Sarah Chen"}</strong>
                <span>{user?.role || t("role_manager")}</span>
              </div>
              <ChevronDown size={15} />
              {profileOpen && (
                <div className="profile-menu">
                  <button>{t("account_settings")}</button>
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
