import { useState } from "react";
import { Plus, MoreHorizontal } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button, SearchInput, Modal, ProgressBar } from "../../components/UI";
import { employees } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate, progressTone } from "../../utils/helpers";
import { ROLES, DEPARTMENTS } from "../../data/company";

export default function Employees() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { t, tv, locale } = useLanguage();
  const list = employees.filter(e =>
    e.name.toLowerCase().includes(q.toLowerCase()) || e.role.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("people_eyebrow")}</span><h1>{t("menu_employees")}</h1><p>{t("employees_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("add_employee")}</Button>
      </div>
      <Card>
        <SectionHeader title={t("all_employees")} action={<SearchInput value={q} onChange={setQ} placeholder={t("search_employees")} />} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("col_employee")}</th><th>{t("col_role")}</th><th>{t("col_department")}</th><th>{t("col_progress")}</th><th>{t("col_status")}</th><th>{t("col_joined")}</th><th /></tr></thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id}>
                  <td><div className="person-cell"><div className="avatar small">{e.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><strong>{e.name}</strong></div></td>
                  <td>{e.role}</td>
                  <td>{tv(e.department)}</td>
                  <td><div className="progress-cell"><ProgressBar value={e.progress} /><span>{e.progress}%</span></div></td>
                  <td><Badge tone={progressTone(e.status)}>{tv(e.status)}</Badge></td>
                  <td>{formatLocalDate(e.joined, locale, { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td><button className="icon-btn"><MoreHorizontal size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={open} title={t("add_employee")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("full_name")}<input placeholder={t("employee_name_placeholder")} /></label>
          <label>{t("work_email")}<input type="email" placeholder="name@company.com" /></label>
          <label>{t("job_role")}<select>{ROLES.map(r => <option key={r.id} value={r.nameEn}>{r.nameEn}</option>)}</select></label>
          <label>{t("department")}<select>{DEPARTMENTS.filter(d => d !== "Company-wide").map(d => <option key={d} value={d}>{tv(d)}</option>)}</select></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("create_employee")}</Button>
        </div>
      </Modal>
    </div>
  );
}
