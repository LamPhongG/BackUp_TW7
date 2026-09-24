import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "../../components/Icons";
import { Button } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form className="auth-form" onSubmit={e => { e.preventDefault(); navigate("/login"); }}>
      <div className="mobile-brand"><Sparkles size={18} /> OnboardAI</div>
      <span className="eyebrow">{t("register_eyebrow")}</span>
      <h2>{t("register_title")}</h2>
      <p className="muted">{t("register_subtitle")}</p>
      <label>
        {t("full_name")}
        <input value={name} onChange={e => setName(e.target.value)} placeholder={t("full_name_placeholder")} />
      </label>
      <label>
        {t("work_email")}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="name@company.com" />
      </label>
      <label>
        {t("password")}
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={t("password_placeholder")} />
      </label>
      <Button type="submit">{t("create_account")} <ArrowUpRight size={16} /></Button>
      <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
        {t("have_account")}{" "}
        <button type="button" className="link-btn" onClick={() => navigate("/login")}>{t("sign_in")}</button>
      </p>
    </form>
  );
}
