import { useState } from "react";
import { BriefcaseBusiness, Plus, ArrowUpRight } from "../../components/Icons";
import { Card, Badge, Button, Modal } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { ROLES, DEPARTMENTS } from "../../data/company";
import { employees } from "../../data/mock";

export default function JobRoles() {
  const [open, setOpen] = useState(false);
  const { t, tv, pick } = useLanguage();
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("config_eyebrow")}</span><h1>{t("menu_job_roles")}</h1><p>{t("job_roles_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("create_role")}</Button>
      </div>
      <div className="role-grid">
        {ROLES.map(r => (
          <Card className="role-card" key={r.id}>
            <div className="role-icon"><BriefcaseBusiness size={19} /></div>
            <div className="card-title-row">
              <div><h3>{r.nameEn}</h3><p>{pick(r, "name") !== r.nameEn ? pick(r, "name") : ""}</p></div>
              <Badge tone="default">{tv(r.department)}</Badge>
            </div>
            <div className="role-metrics">
              <span>{t("onboarding_count", { n: employees.filter(e => e.role === r.nameEn).length })}</span>
            </div>
            <Button variant="ghost">{t("manage")} <ArrowUpRight size={14} /></Button>
          </Card>
        ))}
      </div>
      <Modal open={open} title={t("create_job_role")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("role_name")}<input placeholder={t("role_name_placeholder")} /></label>
          <label>{t("department")}<select>{DEPARTMENTS.filter(d => d !== "Company-wide").map(d => <option key={d} value={d}>{tv(d)}</option>)}</select></label>
          <label>{t("description")}<textarea placeholder={t("role_desc_placeholder")} /></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("create_role")}</Button>
        </div>
      </Modal>
    </div>
  );
}
