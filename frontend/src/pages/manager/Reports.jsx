import { useState } from "react";
import { Download, TrendingUp, Users, Target, Clock3 } from "../../components/Icons";
import { Card, SectionHeader, Button, StatCard } from "../../components/UI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";
import { employees } from "../../data/mock";
import { PROGRESS_STATUSES } from "../../utils/helpers";

const data = [
  { week: 1, completed: 42 },
  { week: 2, completed: 58 },
  { week: 3, completed: 71 },
  { week: 4, completed: 84 },
  { week: 5, completed: 91 },
];

const HEALTH_DOT = { "On Track": "green", "Requires Attention": "orange", "Behind Schedule": "red", "Assessment Required": "orange", Completed: "green" };

export default function Reports() {
  const [format, setFormat] = useState("PDF");
  const { t, tv } = useLanguage();
  const chartData = data.map(d => ({ ...d, name: t("week_n", { n: d.week }) }));
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("nav_analytics")}</span>
          <h1>{t("manager_reports_title")}</h1>
          <p>{t("manager_reports_desc")}</p>
        </div>
        <div className="export-actions">
          <select value={format} onChange={e => setFormat(e.target.value)}>
            {["PDF", "Excel", "CSV"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <Button icon={<Download size={16} />}>{t("export_as", { format })}</Button>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label={t("team_completion_rate")} value="78%" change={t("vs_last_month", { v: "+8.4%" })} icon={Target} tone="green" />
        <StatCard label={t("active_employees")} value="12" change={t("new_this_month", { n: 2 })} icon={Users} tone="blue" />
        <StatCard label={t("avg_completion_time")} value={t("days_n", { n: 71 })} change={t("vs_target_days", { v: "-5" })} icon={Clock3} tone="purple" />
        <StatCard label={t("stat_at_risk_employees")} value="2" change={t("needs_action")} icon={TrendingUp} tone="orange" />
      </div>
      <div className="dashboard-grid">
        <Card>
          <SectionHeader title={t("completion_trend")} subtitle={t("completion_trend_desc")} />
          <div className="chart">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis />
                <Tooltip />
                <Bar dataKey="completed" name={t("completed_items")} fill="#6256e8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionHeader title={t("milestone_health")} subtitle={t("milestone_health_desc")} />
          <div className="health-list">
            {PROGRESS_STATUSES.map(s => (
              <div key={s}><span className={`health-dot ${HEALTH_DOT[s]}`} />{tv(s)} <strong>{employees.filter(e => e.status === s).length}</strong></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
