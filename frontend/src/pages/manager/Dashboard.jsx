import { useNavigate } from "react-router-dom";
import { Users, Target, TrendingUp, Clock3, ArrowUpRight, CheckSquare } from "../../components/Icons";
import { Card, StatCard, SectionHeader, Badge, ProgressBar, Button } from "../../components/UI";
import { employees, tasks } from "../../data/mock";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate, needsAttention, progressTone } from "../../utils/helpers";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t: tr, tv, pick, locale } = useLanguage();
  const atRisk = employees.filter(e => needsAttention(e.status)).length;
  const onTrack = employees.filter(e => e.status === "On Track").length;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{tr("nav_manager_workspace")}</span>
          <h1>{tr("dashboard_greeting", { name: user?.name?.split(" ")[0] || "Sarah" })}</h1>
          <p>{tr("manager_subtitle")}</p>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label={tr("team_members")} value={employees.length} change={tr("new_this_month", { n: 2 })} icon={Users} tone="blue" />
        <StatCard label={tv("On Track")} value={onTrack} change={tr("goal_90_day")} icon={Target} tone="green" />
        <StatCard label={tr("needs_attention")} value={atRisk} change={`${tv("Requires Attention")} + ${tv("Behind Schedule")}`} icon={TrendingUp} tone="orange" />
        <StatCard label={tr("avg_progress")} value="68%" change={`+5% ${tr("this_week")}`} icon={Clock3} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <Card>
          <SectionHeader title={tr("team_progress")} subtitle={tr("team_progress_desc")} action={<Button variant="ghost" onClick={() => navigate("/manager/team")}>{tr("view_all")} <ArrowUpRight size={14} /></Button>} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>{tr("col_employee")}</th><th>{tr("col_role")}</th><th>{tr("col_progress")}</th><th>{tr("col_status")}</th></tr></thead>
              <tbody>
                {employees.slice(0, 4).map(e => (
                  <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/manager/team/${e.id}`)}>
                    <td><div className="person-cell"><div className="avatar small">{e.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><strong>{e.name}</strong></div></td>
                    <td>{e.role}</td>
                    <td><div className="progress-cell"><ProgressBar value={e.progress} /><span>{e.progress}%</span></div></td>
                    <td><Badge tone={progressTone(e.status)}>{tv(e.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <SectionHeader title={tr("pending_reviews")} subtitle={tr("pending_reviews_desc")} />
          <div className="focus-list">
            {tasks.filter(t => t.status === "In Review").map(t => (
              <div className="focus-item" key={t.id}>
                <div className="task-dot active"><CheckSquare size={14} /></div>
                <div><strong>{pick(t, "title")}</strong><span>{tr("due")} {formatLocalDate(t.due, locale)} · {pick(t, "phase")}</span></div>
                <ArrowUpRight size={16} />
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={() => navigate("/manager/tasks")}>{tr("view_all_tasks")} <ArrowUpRight size={15} /></Button>
        </Card>
      </div>
    </div>
  );
}
