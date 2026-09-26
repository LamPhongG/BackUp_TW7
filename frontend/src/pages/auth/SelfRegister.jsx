import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CircleAlert, CircleCheck, Eye, EyeOff, Sparkles } from "../../components/Icons";
import { apiRequest, backendEnabled } from "../../services/apiClient";
import { useLanguage } from "../../contexts/LanguageContext";

// Giá trị enum PathLevel của backend
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const EMPTY_FORM = {
  name: "", email: "", password: "", confirm: "",
  experience_level: "Beginner", location: "", joining_date: "", previous_experience: "",
};

function loadErrorKey(err) {
  if (err.status === 410) return "register_invite_expired";
  if (err.status === 404) return "register_invite_invalid";
  return err.code || "err_network";
}

export default function SelfRegister() {
  const { token } = useParams();
  const { t, lang } = useLanguage();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState(backendEnabled() ? "" : "register_needs_backend");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    if (!backendEnabled()) return undefined;
    let active = true;
    apiRequest(`/invite/${token}`)
      .then(data => {
        if (!active) return;
        setInvite(data);
        if (data.invited_email) setForm(f => ({ ...f, email: data.invited_email }));
      })
      .catch(err => { if (active) setLoadError(loadErrorKey(err)); });
    return () => { active = false; };
  }, [token]);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined, submit: undefined }));
  };

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = "register_err_name";
    if (!form.email.trim()) found.email = "register_err_email";
    if (form.password.length < 8) found.password = "register_err_password";
    if (form.password !== form.confirm) found.confirm = "register_err_confirm";
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest(`/invite/${token}/register`, {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          experience_level: form.experience_level,
          location: form.location.trim() || null,
          joining_date: form.joining_date || null,
          previous_experience: form.previous_experience.trim() || null,
        },
      });
      setRegisteredEmail(res.email);
    } catch (err) {
      setErrors({ submit: err.code || (err.status === 422 ? "register_err_invalid" : "err_network") });
    } finally {
      setSubmitting(false);
    }
  };

  const brand = <div className="glass-card__brand"><span className="brand-mark"><Sparkles size={16} /></span> SkillSprint AI</div>;

  if (loadError) return (
    <div className="glass-card">
      {brand}
      <h2>{t("register_invalid_title")}</h2>
      <p className="glass-card__subtitle">{t(loadError)}</p>
      <Link to="/login" className="glass-btn register-link-btn">{t("register_to_login")}</Link>
    </div>
  );

  if (!invite) return (
    <div className="glass-card"><p className="glass-card__subtitle">{t("register_loading")}</p></div>
  );

  if (registeredEmail) return (
    <div className="glass-card">
      {brand}
      <CircleCheck size={44} className="register-done-icon" />
      <h2>{t("register_done_title")}</h2>
      <p className="glass-card__subtitle">{t("register_done_text", { email: registeredEmail })}</p>
      <Link to="/login" className="glass-btn register-link-btn">{t("register_to_login")}</Link>
    </div>
  );

  const field = (key, label, props = {}) => (
    <div className="glass-float">
      <input id={`reg-${key}`} placeholder=" " value={form[key]} aria-invalid={!!errors[key]}
        onChange={e => set(key, e.target.value)} {...props} />
      <label htmlFor={`reg-${key}`}>{label}</label>
      {errors[key] && <p className="register-field-error">{t(errors[key])}</p>}
    </div>
  );

  return (
    <form className="glass-card register-card" onSubmit={submit} noValidate>
      {brand}
      <h2>{t("register_title")}</h2>
      <p className="register-target">
        {lang === "en" ? invite.job_position_name_en : invite.job_position_name}
        {" · "}
        {lang === "en" ? invite.department_name_en : invite.department_name}
      </p>

      {field("name", t("register_name"), { autoComplete: "name" })}
      {field("email", t("register_email"), { type: "email", autoComplete: "email", readOnly: !!invite.invited_email })}
      <div className="glass-float">
        <input id="reg-password" type={showPassword ? "text" : "password"} placeholder=" " autoComplete="new-password"
          value={form.password} aria-invalid={!!errors.password} onChange={e => set("password", e.target.value)} />
        <label htmlFor="reg-password">{t("register_password")}</label>
        <button type="button" className="glass-eye" onClick={() => setShowPassword(v => !v)}
          aria-label={t(showPassword ? "login_hide_password" : "login_show_password")}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {errors.password && <p className="register-field-error">{t(errors.password)}</p>}
      </div>
      {field("confirm", t("register_confirm"), { type: showPassword ? "text" : "password", autoComplete: "new-password" })}

      <p className="register-section">{t("register_optional")}</p>
      <div className="glass-float">
        <select id="reg-level" value={form.experience_level} onChange={e => set("experience_level", e.target.value)}>
          {LEVELS.map(level => <option key={level} value={level}>{t(`v_${level.toLowerCase()}`)}</option>)}
        </select>
        <label htmlFor="reg-level" className="register-fixed-label">{t("register_level")}</label>
      </div>
      {field("location", t("register_location"))}
      <div className="glass-float">
        <input id="reg-joining_date" type="date" value={form.joining_date} onChange={e => set("joining_date", e.target.value)} />
        <label htmlFor="reg-joining_date" className="register-fixed-label">{t("register_joining_date")}</label>
      </div>
      <div className="glass-float">
        <textarea id="reg-experience" rows={3} maxLength={2000} placeholder=" " value={form.previous_experience}
          onChange={e => set("previous_experience", e.target.value)} />
        <label htmlFor="reg-experience" className="register-fixed-label">{t("register_experience")}</label>
      </div>

      {errors.submit && <p className="glass-error" role="alert"><CircleAlert size={15} /> {t(errors.submit)}</p>}
      <button type="submit" className="glass-btn" disabled={submitting}>
        {t(submitting ? "register_submitting" : "register_submit")}
      </button>
      <p className="glass-register">
        {t("register_have_account")} <Link to="/login" className="glass-link">{t("register_to_login")}</Link>
      </p>
    </form>
  );
}
