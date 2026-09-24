import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "../../components/Icons";
import { Button } from "../../components/UI";
import { useAuth, ROLES } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("alex@acme.com");
  const [password, setPassword] = useState("password");

  const handleLogin = (roleKey) => {
    const role = login(roleKey);
    if (role === ROLES.EMPLOYEE) navigate("/employee/dashboard");
    else if (role === ROLES.MANAGER) navigate("/manager/dashboard");
    else navigate("/admin/dashboard");
  };

  return (
    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin("employee"); }}>
      <div className="mobile-brand"><Sparkles size={18} /> OnboardAI</div>
      <span className="eyebrow">{t("login_eyebrow")}</span>
      <h2>{t("login_title")}</h2>
      <p className="muted">{t("login_subtitle")}</p>
      <label>
        {t("work_email")}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
      </label>
      <label>
        {t("password")}
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
      </label>
      <div className="form-row-between">
        <label className="checkbox"><input type="checkbox" /> {t("remember_me")}</label>
        <button type="button" className="link-btn" onClick={() => navigate("/forgot-password")}>{t("forgot_password")}</button>
      </div>
      <Button type="submit">{t("sign_in")} <ArrowUpRight size={16} /></Button>
      <p style={{ textAlign: "center", marginTop: 12 }}>
        {t("no_account")}{" "}
        <button type="button" className="link-btn" onClick={() => navigate("/register")}>{t("register")}</button>
      </p>
      <div className="demo-login">
        <span>{t("demo_login_as")}</span>
        <div>
          <button type="button" onClick={() => handleLogin("employee")}>{t("role_employee")}</button>
          <button type="button" onClick={() => handleLogin("manager")}>{t("role_manager")}</button>
          <button type="button" onClick={() => handleLogin("admin")}>{t("role_admin")}</button>
        </div>
      </div>
    </form>
  );
}
