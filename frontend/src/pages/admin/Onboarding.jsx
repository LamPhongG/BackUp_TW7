import { useState } from "react";
import { Plus } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button, Modal } from "../../components/UI";
import { employees, phases } from "../../data/mock";
import { ROLES } from "../../data/company";
import { useLanguage } from "../../contexts/LanguageContext";

const plans = employees.map((e, i) => ({
  ...e,
  planStatus: e.progress >= 90 ? "Completed" : e.progress >= 50 ? "Active" : "Draft",
  phases: phases.length,
  tasks: 15 + i,
}));

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const { t, tv } = useLanguage();
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("plans_eyebrow")}</span><h1>{t("menu_onboarding")}</h1><p>{t("plans_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("create_plan")}</Button>
      </div>
      <Card>
        <SectionHeader title={t("active_plans")} subtitle={t("active_plans_desc")} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("col_employee")}</th><th>{t("col_role")}</th><th>{t("col_phases")}</th><th>{t("col_tasks")}</th><th>{t("col_progress")}</th><th>{t("col_status")}</th></tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id}>
                  <td><div className="person-cell"><div className="avatar small">{p.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><strong>{p.name}</strong></div></td>
                  <td>{p.role}</td>
                  <td>{p.phases}</td>
                  <td>{p.tasks}</td>
                  <td>{p.progress}%</td>
                  <td><Badge tone={p.planStatus === "Completed" ? "green" : p.planStatus === "Active" ? "purple" : "orange"}>{tv(p.planStatus)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} title={t("create_onboarding_plan")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("employee")}<select>{employees.map(e => <option key={e.id}>{e.name}</option>)}</select></label>
          <label>{t("job_role")}<select>{ROLES.map(r => <option key={r.id} value={r.nameEn}>{r.nameEn}</option>)}</select></label>
          <label>{t("start_date")}<input type="date" /></label>
          <label>{t("plan_duration")}<select>{[90, 60, 30].map(n => <option key={n} value={n}>{t("days_n", { n })}</option>)}</select></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("create_plan")}</Button>
        </div>
      </Modal>
    </div>
  );
}
