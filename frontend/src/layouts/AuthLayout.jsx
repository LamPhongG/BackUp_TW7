import { Outlet } from "react-router-dom";
import { useLanguage, LanguageToggle } from "../contexts/LanguageContext";

/** Nửa trái giới thiệu sản phẩm, nửa phải là nền gradient cho thẻ đăng nhập dạng kính */
export default function AuthLayout() {
  const { t } = useLanguage();
  return (
    <div className="auth-page">
      <section className="auth-visual">
        <video autoPlay loop muted playsInline className="auth-video-bg">
          <source src="/videocym.mp4" type="video/mp4" />
        </video>
        <div className="auth-overlay"></div>
        <div className="auth-brand">
          <img src="/logonhomai.jpg" alt="Logo" className="auth-logo-icon" />
          SkillSprint AI
        </div>
        <div className="auth-hero">
          <span className="eyebrow">{t("auth_eyebrow")}</span>
          <h1>{t("auth_title")}</h1>
        </div>
      </section>

      <section className="auth-glass">
        <span className="glass-blob glass-blob--1" aria-hidden="true" />
        <span className="glass-blob glass-blob--2" aria-hidden="true" />
        <span className="glass-blob glass-blob--3" aria-hidden="true" />
        <LanguageToggle className="glass-lang" />
        <Outlet />
      </section>
    </div>
  );
}
