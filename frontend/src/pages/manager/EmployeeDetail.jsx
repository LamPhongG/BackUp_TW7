import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CalendarDays, CheckSquare } from "../../components/Icons";
import { Card, Badge, ProgressBar, Button } from "../../components/UI";
import { employees, tasks } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate, progressTone } from "../../utils/helpers";

export default function EmployeeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t: tr, tv, pick, locale } = useLanguage();
  const e = employees.find(x => x.id === Number(id)) || employees[0];
  return (
    <div>
      <button className="back-btn" onClick={() => nav("/manager/team")}>
        <ArrowLeft size={16} /> {tr("back_to_team")}
      </button>
      <div className="profile-hero">
        <div className="avatar xl">{e.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div>
        <div>
          <span className="eyebrow">{tr("employee_profile")}</span>
          <h1>{e.name}</h1>
          <p>{e.role} · {tv(e.department)}</p>
          <div className="detail-meta">
            <span><Mail size={15} /> {e.name.toLowerCase().replace(" ", ".")}@fourangrybirds.vn</span>
            <span><CalendarDays size={15} /> {tr("joined_on", { date: formatLocalDate(e.joined, locale, { day: "2-digit", month: "short", year: "numeric" }) })}</span>
          </div>
        </div>
        <Badge tone={progressTone(e.status)}>{tv(e.status)}</Badge>
      </div>
      <div className="dashboard-grid">
        <Card>
          <span className="eyebrow">{tr("onboarding_progress")}</span>
          <h2>{e.progress}%</h2>
          <ProgressBar value={e.progress} />
          <div className="metric-grid">
            <div><strong>18</strong><span>{tv("Completed")}</span></div>
            <div><strong>7</strong><span>{tv("In Progress")}</span></div>
            <div><strong>3</strong><span>{tr("upcoming")}</span></div>
          </div>
        </Card>
        <Card>
          <span className="eyebrow">{tr("manager_actions")}</span>
          <h3>{tr("review_this_week")}</h3>
          <p>{tr("items_attention", { n: 2 })}</p>
          <Button icon={<CheckSquare size={16} />}>{tr("review_tasks")}</Button>
        </Card>
      </div>
      <Card>
        <div className="card-title-row">
          <h3>{tr("recent_activity")}</h3>
          <Badge tone="purple">{tr("live")}</Badge>
        </div>
        {tasks.slice(0, 4).map(t => (
          <div className="activity-row" key={t.id}>
            <div className="activity-icon"><CheckSquare size={16} /></div>
            <div><strong>{pick(t, "title")}</strong><span>{tv(t.status)} · {pick(t, "phase")}</span></div>
            <small>{formatLocalDate(t.due, locale)}</small>
          </div>
        ))}
      </Card>
    </div>
  );
}
