import { useState } from "react";
import { CheckSquare, Plus } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button, SearchInput, Modal } from "../../components/UI";
import { tasks as initialTasks, employees, phases } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate } from "../../utils/helpers";

export default function ManagerTasks() {
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
          <span className="eyebrow">{tr("team_tasks_eyebrow")}</span>
          <h1>{tr("tasks_overview")}</h1>
          <p>{tr("tasks_overview_desc")}</p>
        </div>
        <Button onClick={() => setModal(true)} icon={<Plus size={16} />}>{tr("assign_task")}</Button>
      </div>
      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder={tr("search_tasks")} />
      </div>
      <Card>
        <SectionHeader title={tr("tasks_count", { n: filtered.length })} subtitle={tr("team_tasks_subtitle")} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{tr("col_task")}</th><th>{tr("col_phase")}</th><th>{tr("col_assigned_to")}</th><th>{tr("col_due")}</th><th>{tr("col_status")}</th><th>{tr("col_action")}</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><div className="table-primary"><span className={t.status === "Completed" ? "row-check done" : "row-check"}>{t.status === "Completed" && "✓"}</span><strong>{pick(t, "title")}</strong></div></td>
                  <td>{pick(t, "phase")}</td>
                  <td>{t.owner}</td>
                  <td>{formatLocalDate(t.due, locale)}</td>
                  <td><Badge tone={t.status === "Completed" ? "green" : t.status === "In Progress" ? "purple" : t.status === "In Review" ? "orange" : "default"}>{tv(t.status)}</Badge></td>
                  <td><button className="icon-btn" onClick={() => complete(t.id)}><CheckSquare size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={modal} title={tr("assign_task")} onClose={() => setModal(false)}>
        <div className="form-grid">
          <label>{tr("task_title_label")}<input placeholder={tr("assign_task_placeholder")} /></label>
          <label>{tr("col_assigned_to")}<select>{employees.map(e => <option key={e.id}>{e.name}</option>)}</select></label>
          <label>{tr("col_phase")}<select>{phases.slice(1, 4).map(p => <option key={p.id} value={p.id}>{pick(p, "label")}</option>)}</select></label>
          <label>{tr("due_date")}<input type="date" /></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setModal(false)}>{tr("cancel")}</Button>
          <Button onClick={() => setModal(false)}>{tr("assign_task")}</Button>
        </div>
      </Modal>
    </div>
  );
}
