import { useState } from "react";
import { Building2, Plus } from "../../components/Icons";
import { Card, Badge, Button, Modal } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { DEPARTMENTS, ROLES } from "../../data/company";
import { employees } from "../../data/mock";

// Trưởng phòng (dữ liệu tổ chức mẫu)
const HEADS = {
  Sales: "Olivia Brown",
  "Customer Support": "Sarah Chen",
  "Human Resources": "Jordan Lee",
  Finance: "Michael Lee",
  Operations: "Michael Lee",
  Marketing: "Olivia Brown",
  Engineering: "Sarah Chen",
  "Branch Management": "Jordan Lee",
  Data: "Michael Lee",
};

const departments = DEPARTMENTS.filter(d => d !== "Company-wide").map(name => ({
  name,
  head: HEADS[name] || "—",
  roles: ROLES.filter(r => r.department === name).length,
  onboarding: employees.filter(e => e.department === name).length,
}));

export default function Departments() {
  const [open, setOpen] = useState(false);
  const { t, tv } = useLanguage();
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("org_eyebrow")}</span><h1>{t("menu_departments")}</h1><p>{t("departments_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("add_department")}</Button>
      </div>
      <div className="role-grid">
        {departments.map(d => (
          <Card className="role-card" key={d.name}>
            <div className="role-icon"><Building2 size={19} /></div>
            <div className="card-title-row">
              <div><h3>{tv(d.name)}</h3><p>{t("dept_head", { name: d.head })}</p></div>
              <Badge tone="green">{tv("Active")}</Badge>
            </div>
            <div className="role-metrics">
              <span>{t("roles_count", { n: d.roles })}</span>
              <span>{t("onboarding_count", { n: d.onboarding })}</span>
            </div>
            <Button variant="ghost">{t("manage")} →</Button>
          </Card>
        ))}
      </div>
      <Modal open={open} title={t("add_department")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("department_name")}<input placeholder={t("department_name_placeholder")} /></label>
          <label>{t("department_head")}<input placeholder={t("manager_name_placeholder")} /></label>
          <label>{t("description")}<textarea placeholder={t("dept_desc_placeholder")} /></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("create_department")}</Button>
        </div>
      </Modal>
    </div>
  );
}
