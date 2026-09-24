import { useState } from "react";
import { Download, TrendingUp, Users, ShieldCheck, FileText, CircleCheck } from "../../components/Icons";
import { Card, SectionHeader, Button, StatCard, Badge } from "../../components/UI";
import { ValidationSummary } from "../../components/ValidationTag";
import { reportData } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

export default function AdminReports() {
  const [format, setFormat] = useState("PDF");
  const [loadingExport, setLoadingExport] = useState(false);
  const { t, tv, tNode } = useLanguage();
  const weeklyData = reportData.weeklyCompletion.map(w => ({ ...w, name: t("week_n", { n: w.week }) }));

  const handleExport = () => {
    setLoadingExport(true);
    setTimeout(() => setLoadingExport(false), 1500);
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("reports_eyebrow")}</span>
          <h1>{t("admin_reports_title")}</h1>
          <p>{t("admin_reports_desc")}</p>
        </div>
        <div className="export-actions">
          <select value={format} onChange={e => setFormat(e.target.value)}>
            <option value="PDF">{t("export_as", { format: "PDF" })}</option>
            <option value="CSV">{t("export_as", { format: "CSV" })}</option>
            <option value="Excel">{t("export_as", { format: "Excel" })}</option>
          </select>
          <Button onClick={handleExport} disabled={loadingExport} icon={<Download size={16} />}>
            {loadingExport ? t("generating_report") : t("export_as", { format })}
          </Button>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="stat-grid">
        <StatCard label={t("stat_onboarding_completion")} value="78%" change={t("vs_last_month", { v: "+8.4%" })} icon={TrendingUp} tone="green" />
        <StatCard label={t("stat_onboarding_now")} value="42" change={t("new_joiners", { n: 6 })} icon={Users} tone="blue" />
        <StatCard label={t("stat_policy_coverage")} value={`${reportData.coverageScore}%`} change={t("target_gt", { n: 80 })} icon={ShieldCheck} tone="purple" />
        <StatCard label={t("stat_ai_traceability")} value={`${reportData.traceabilityScore}%`} change={t("target_gt", { n: 90 })} icon={CircleCheck} tone="orange" />
      </div>

      <div className="dashboard-grid">
        {/* CHART: TIẾN ĐỘ THỜI GIAN */}
        <Card>
          <SectionHeader 
            title={t("compliance_chart_title")}
            subtitle={t("compliance_chart_desc")}
          />
          <div className="chart" style={{ marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, marginTop: 10 }} />
                <Bar dataKey="target" name={t("target_label")} fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="completed" name={t("actual_label")} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI VALIDATION SUMMARY */}
        <Card>
          <SectionHeader 
            title={t("ai_quality_title")}
            subtitle={t("ai_quality_desc")}
          />
          <ValidationSummary counts={reportData.validationCounts} />
          
          <div style={{ marginTop: 24, padding: 16, background: 'var(--blue-bg)', borderRadius: 10 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> {t("traceability_report")}
            </h4>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--navy)', lineHeight: 1.5 }}>
              {tNode("traceability_text", {
                h: <strong>{t("hallucination_errors", { n: reportData.validationCounts.hallucination })}</strong>,
                c: <strong>{t("contradiction_errors", { n: reportData.validationCounts.contradiction })}</strong>,
              })}
            </p>
          </div>
        </Card>
      </div>

      {/* DEPARTMENT PROGRESS TABLE */}
      <Card style={{ marginTop: 18 }}>
        <SectionHeader title={t("dept_stats_title")} subtitle={t("dept_stats_desc")} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("col_department")}</th>
                <th>{t("col_headcount")}</th>
                <th>{t("col_avg_progress")}</th>
                <th>{t("col_coverage")}</th>
                <th>{t("col_traceability")}</th>
                <th>{t("col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.departmentProgress.map((dept, idx) => (
                <tr key={idx}>
                  <td><strong>{tv(dept.dept)}</strong></td>
                  <td>{t("people_n", { n: dept.employees })}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-wrap" style={{ flex: 1 }}>
                        <div className="progress-track" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${dept.avgProgress}%`, background: dept.avgProgress > 70 ? 'var(--green)' : 'var(--orange)' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{dept.avgProgress}%</span>
                    </div>
                  </td>
                  <td><Badge tone={dept.coverageScore >= 80 ? "green" : "orange"}>{dept.coverageScore}%</Badge></td>
                  <td><Badge tone={dept.traceabilityScore >= 90 ? "purple" : "orange"}>{dept.traceabilityScore}%</Badge></td>
                  <td>
                    {dept.avgProgress >= 70 ? (
                      <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>{t("on_schedule")}</span>
                    ) : (
                      <span style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 600 }}>{t("behind_schedule")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
