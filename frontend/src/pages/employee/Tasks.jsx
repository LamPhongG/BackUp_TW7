import { useState } from "react";
import { CheckSquare, Plus, CalendarDays } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button, SearchInput, Modal } from "../../components/UI";
import { tasks as initialTasks, phases } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate } from "../../utils/helpers";

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const { t: tr, tv, pick, locale } = useLanguage();
  const filtered = tasks.filter(t => pick(t, "title").toLowerCase().includes(query.toLowerCase()));
  const complete = id => setTasks(tasks.map(t => t.id === id ? { ...t, status: "Completed" } : t));

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{tr("work_plan_eyebrow")}</span>
          <h1>{tr("my_tasks_title")}</h1>
          <p>{tr("my_tasks_desc")}</p>
        </div>
        <Button onClick={() => setModal(true)} icon={<Plus size={16} />}>{tr("new_task")}</Button>
      </div>
      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder={tr("search_tasks")} />
        <Button variant="secondary" icon={<CalendarDays size={16} />}>{tr("calendar")}</Button>
      </div>
      <Card>
        <SectionHeader title={tr("tasks_count", { n: filtered.length })} subtitle={tr("my_tasks_subtitle")} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{tr("col_task")}</th><th>{tr("col_phase")}</th><th>{tr("col_due")}</th><th>{tr("col_status")}</th><th>{tr("col_action")}</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="table-primary">
                      <span className={t.status === "Completed" ? "row-check done" : "row-check"}>{t.status === "Completed" && "✓"}</span>
                      <strong>{pick(t, "title")}</strong>
                    </div>
                  </td>
                  <td>{pick(t, "phase")}</td>
                  <td>{formatLocalDate(t.due, locale)}</td>
                  <td><Badge tone={t.status === "Completed" ? "green" : t.status === "In Progress" ? "purple" : "orange"}>{tv(t.status)}</Badge></td>
                  <td><button className="icon-btn" onClick={() => complete(t.id)}><CheckSquare size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={modal} title={tr("create_task_title")} onClose={() => setModal(false)}>
        <div className="form-grid">
          <label>{tr("task_title_label")}<input placeholder={tr("task_title_placeholder")} /></label>
          <label>{tr("col_phase")}<select>{phases.slice(1, 4).map(p => <option key={p.id} value={p.id}>{pick(p, "label")}</option>)}</select></label>
          <label>{tr("due_date")}<input type="date" /></label>
          <label>{tr("priority")}<select><option value="normal">{tr("priority_normal")}</option><option value="high">{tr("priority_high")}</option></select></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setModal(false)}>{tr("cancel")}</Button>
          <Button onClick={() => setModal(false)}>{tr("create_task")}</Button>
        </div>
      </Modal>
    </div>
  );
}
