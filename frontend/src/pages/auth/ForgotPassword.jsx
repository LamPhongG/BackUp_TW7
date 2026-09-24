import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "../../components/Icons";
import { Button } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // Tách câu quanh {email} để in đậm email mà vẫn giữ đúng trật tự từ của từng ngôn ngữ
  const [sentBefore, sentAfter = ""] = t("reset_sent_desc").split("{email}");

  if (sent) return (
    <div className="auth-form">
      <div className="mobile-brand"><Sparkles size={18} /> OnboardAI</div>
      <span className="eyebrow">{t("reset_sent_eyebrow")}</span>
      <h2>{t("reset_sent_title")}</h2>
      <p className="muted">{sentBefore}<strong>{email}</strong>{sentAfter}</p>
      <Button onClick={() => navigate("/login")}>{t("back_to_sign_in")}</Button>
    </div>
  );

  return (
    <form className="auth-form" onSubmit={e => { e.preventDefault(); setSent(true); }}>
      <div className="mobile-brand"><Sparkles size={18} /> OnboardAI</div>
      <span className="eyebrow">{t("forgot_eyebrow")}</span>
      <h2>{t("forgot_title")}</h2>
      <p className="muted">{t("forgot_subtitle")}</p>
      <label>
        {t("work_email")}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="name@company.com" required />
      </label>
      <Button type="submit">{t("send_reset_link")} <ArrowUpRight size={16} /></Button>
      <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
        <button type="button" className="link-btn" onClick={() => navigate("/login")}>← {t("back_to_sign_in")}</button>
      </p>
    </form>
  );
}
