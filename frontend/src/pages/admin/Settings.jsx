import { useState } from "react";
import { Save } from "../../components/Icons";
import { Card, SectionHeader, Button, Toast } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { company } from "../../data/company";

export default function Settings() {
  // Lưu key thay vì chuỗi đã dịch để toast đổi theo ngôn ngữ
  const [toastKey, setToastKey] = useState("");
  const { t, pick } = useLanguage();
  const save = () => setToastKey("settings_saved");

  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("nav_admin")}</span><h1>{t("menu_settings")}</h1><p>{t("settings_desc")}</p></div>
        <Button onClick={save} icon={<Save size={16} />}>{t("save_changes")}</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card>
          <SectionHeader title={t("platform_config")} subtitle={t("platform_config_desc")} />
          <div className="form-grid">
            <label>{t("platform_name")}<input defaultValue="SkillSprint AI" /></label>
            <label>{t("company_name")}<input key={pick(company, "name")} defaultValue={pick(company, "name")} /></label>
            <label>{t("default_duration")}<select>{[90, 60, 30].map(n => <option key={n} value={n}>{t("days_n", { n })}</option>)}</select></label>
            <label>{t("default_language")}<select>
              <option value="en">{t("lang_english")}</option>
              <option value="vi">{t("lang_vietnamese")}</option>
              <option value="fr">{t("lang_french")}</option>
            </select></label>
          </div>
        </Card>
        <Card>
          <SectionHeader title={t("notifications")} subtitle={t("notifications_desc")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "notif_new_employee",
              "notif_phase_complete",
              "notif_at_risk",
              "notif_review_reminder",
            ].map(key => (
              <label key={key} className="checkbox" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                <input type="checkbox" defaultChecked /> {t(key)}
              </label>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title={t("ai_config")} subtitle={t("ai_config_desc")} />
          <div className="form-grid">
            <label>{t("ai_model")}<select><option>Gemini Pro</option><option>Gemini Flash</option></select></label>
            <label>{t("max_tokens")}<select><option>2000</option><option>4000</option><option>8000</option></select></label>
            <label>{t("review_required")}<select>
              <option value="always">{t("always_required")}</option>
              <option value="optional">{t("optional")}</option>
            </select></label>
          </div>
        </Card>
      </div>
      <Toast message={toastKey && t(toastKey)} onClose={() => setToastKey("")} />
    </div>
  );
}
