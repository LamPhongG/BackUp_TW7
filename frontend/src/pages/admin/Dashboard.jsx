import { useNavigate } from "react-router-dom";
import { Users, Target, TrendingUp, Clock3, ArrowUpRight, BrainCircuit, Sparkles } from "../../components/Icons";
import { Card, StatCard, SectionHeader, Badge, ProgressBar, Button } from "../../components/UI";
import { employees } from "../../data/mock";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { needsAttention, progressTone } from "../../utils/helpers";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, tv } = useLanguage();
  const atRisk = employees.filter(e => needsAttention(e.status)).length;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("admin_eyebrow")}</span>
          <h1>{t("admin_welcome", { name: user?.name?.split(" ")[0] || "Jordan" })}</h1>
          <p>{t("admin_subtitle")}</p>
        </div>
        <Button onClick={() => navigate("/admin/ai-studio")} icon={<Sparkles size={16} />}>{t("open_ai_studio")}</Button>
      </div>
      <div className="stat-grid">
        <StatCard label={t("stat_total_employees")} value={employees.length} change={t("new_this_month", { n: 2 })} icon={Users} tone="blue" />
        <StatCard label={t("stat_completion_rate")} value="78%" change={t("vs_last_month", { v: "+8.4%" })} icon={Target} tone="green" />
        <StatCard label={t("stat_at_risk_employees")} value={atRisk} change={t("needs_attention")} icon={TrendingUp} tone="orange" />
        <StatCard label={t("stat_avg_time_complete")} value={t("days_n", { n: 71 })} change={t("vs_target_days", { v: "-5" })} icon={Clock3} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <Card>
          <SectionHeader
            title={t("all_employees")}
            subtitle={t("all_employees_desc")}
            action={<Button variant="ghost" onClick={() => navigate("/admin/employees")}>{t("view_all")} <ArrowUpRight size={14} /></Button>}
          />
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("col_employee")}</th><th>{t("col_role")}</th><th>{t("col_progress")}</th><th>{t("col_status")}</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
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
          <SectionHeader title={t("quick_actions")} subtitle={t("quick_actions_desc")} />
          <div className="focus-list">
            {[
              ["add_employee", "/admin/employees"],
              ["upload_document", "/admin/documents"],
              ["generate_onboarding_plan", "/admin/ai-studio"],
              ["view_reports", "/admin/reports"],
            ].map(([key, path]) => (
              <div className="focus-item" key={key} onClick={() => navigate(path)} style={{ cursor: "pointer" }}>
                <div className="task-dot active"><BrainCircuit size={14} /></div>
                <div><strong>{t(key)}</strong></div>
                <ArrowUpRight size={16} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
