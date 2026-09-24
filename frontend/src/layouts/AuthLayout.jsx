import { Outlet } from "react-router-dom";
import { Sparkles, ShieldCheck } from "../components/Icons";
import { useLanguage, LanguageToggle } from "../contexts/LanguageContext";

export default function AuthLayout() {
  const { t } = useLanguage();
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          OnboardAI
        </div>
        <div className="auth-hero">
          <span className="eyebrow">{t("auth_eyebrow")}</span>
          <h1>{t("auth_title")}</h1>
          <p>{t("auth_desc")}</p>
          <div className="auth-mini">
            <ShieldCheck size={18} />
            <span>{t("auth_mini")}</span>
          </div>
        </div>
      </div>
      <div className="auth-form-wrap" style={{ position: "relative" }}>
        <LanguageToggle style={{ position: "absolute", top: 16, right: 16 }} />
        <Outlet />
      </div>
    </div>
  );
}
