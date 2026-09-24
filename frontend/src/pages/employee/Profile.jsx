import { useAuth } from "../../hooks/useAuth";
import { Card, Badge, ProgressBar } from "../../components/UI";
import { Mail, CalendarDays, BriefcaseBusiness, Building2 } from "../../components/Icons";
import { tasks, modules, employees } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate } from "../../utils/helpers";

export default function Profile() {
  const { user } = useAuth();
  const { t, tv, locale } = useLanguage();
  const completedTasks = tasks.filter(task => task.status === "Completed").length;
  const completedModules = modules.filter(m => m.status === "Completed").length;
  const name = user?.name || "Alex Morgan";
  const department = user?.department || "Engineering";
  // Lấy ngày gia nhập từ dữ liệu nhân viên thay vì hard-code
  const joined = employees.find(e => e.name === name)?.joined;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("account_eyebrow")}</span>
          <h1>{t("my_profile")}</h1>
          <p>{t("profile_desc")}</p>
        </div>
        <Badge tone="green">{t("active_employee")}</Badge>
      </div>
      <div className="dashboard-grid">
        <Card>
          <div className="profile-hero">
            <div className="avatar xl">{user?.avatar || "AM"}</div>
            <div>
              <span className="eyebrow">{t("employee_profile")}</span>
              <h1>{name}</h1>
              <p>{user?.role || "Software Support Engineer"} · {tv(department)}</p>
              <div className="detail-meta">
                <span><Mail size={15} /> {name.toLowerCase().replace(" ", ".")}@fourangrybirds.vn</span>
                {joined && <span><CalendarDays size={15} /> {t("joined_on", { date: formatLocalDate(joined, locale, { day: "2-digit", month: "short", year: "numeric" }) })}</span>}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <span className="eyebrow">{t("onboarding_progress")}</span>
            <h2 style={{ margin: "8px 0 4px" }}>{user?.onboardingProgress || 68}%</h2>
            <ProgressBar value={user?.onboardingProgress || 68} />
          </div>
          <div className="metric-grid" style={{ marginTop: 20 }}>
            <div><strong>{completedTasks}</strong><span>{t("tasks_done")}</span></div>
            <div><strong>{completedModules}</strong><span>{t("modules_done")}</span></div>
            <div><strong>4</strong><span>{t("days_to_milestone")}</span></div>
          </div>
        </Card>
        <Card>
          <span className="eyebrow">{t("role_info")}</span>
          <h3 style={{ marginTop: 8 }}>{t("job_details")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            <div className="detail-meta" style={{ flexDirection: "column", gap: 12 }}>
              <span><BriefcaseBusiness size={15} /> {user?.role || "Software Support Engineer"}</span>
              <span><Building2 size={15} /> {tv(department)}</span>
              <span><Mail size={15} /> {t("manager_label", { name: "Sarah Chen" })}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
