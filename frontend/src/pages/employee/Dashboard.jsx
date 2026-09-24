import { useNavigate } from "react-router-dom";
import { BookOpen, CheckSquare, Clock3, Target, ArrowUpRight, Play, CircleCheck, CalendarDays } from "../../components/Icons";
import { Card, ProgressBar, Badge, SectionHeader, StatCard, Button } from "../../components/UI";
import { useAuth } from "../../hooks/useAuth";
import { phases, tasks, modules } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate, todayISO } from "../../utils/helpers";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, pick, locale } = useLanguage();
  const completed = tasks.filter(task => task.status === "Completed").length;
  const firstName = user?.name?.split(" ")[0] || "Alex";

  const greeting = t("dashboard_greeting", { name: firstName });
  const today = formatLocalDate(todayISO(), locale, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{today}</span>
          <h1>{greeting}</h1>
          <p>{t("dashboard_subtitle")}</p>
        </div>
        <Button variant="secondary" icon={<CalendarDays size={16} />}>{t("view_calendar")}</Button>
      </div>
      <div className="stat-grid">
        <StatCard label={t("onboarding_progress")} value="68%" change={`+12% ${t("this_week")}`} icon={Target} tone="purple" />
        <StatCard label={t("learning_modules")} value="3 / 6" change={`2 ${t("in_progress_count")}`} icon={BookOpen} tone="blue" />
        <StatCard label={t("tasks_completed")} value={`${completed} / ${tasks.length}`} change={`1 ${t("awaiting_review")}`} icon={CheckSquare} tone="green" />
        <StatCard label={t("next_milestone")} value={t("day_n", { n: 30 })} change={`4 ${t("days_remaining")}`} icon={Clock3} tone="orange" />
      </div>
      <div className="dashboard-grid">
        <Card className="hero-progress">
          <div className="card-title-row">
            <div><span className="eyebrow">{t("your_journey")}</span><h3>{t("journey_title")}</h3></div>
            <Badge tone="purple">{t("percent_complete", { n: 68 })}</Badge>
          </div>
          <div className="phase-timeline">
            {phases.map((p, i) => (
              <div className={`phase ${p.status}`} key={p.id}>
                <div className="phase-dot">{p.status === "completed" ? <CircleCheck size={15} /> : i + 1}</div>
                <div className="phase-content">
                  <strong>{pick(p, "label")}</strong><span>{pick(p, "sublabel")}</span>
                  <ProgressBar value={p.progress} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title={t("todays_focus")} subtitle={t("focus_subtitle")} />
          <div className="focus-list">
            {tasks.slice(2, 5).map(task => (
              <div className="focus-item" key={task.id}>
                <div className={`task-dot ${task.status === "In Progress" ? "active" : ""}`}>
                  {task.status === "Completed" ? <CircleCheck size={16} /> : <Play size={13} />}
                </div>
                <div><strong>{pick(task, "title")}</strong><span>{t("due")} {formatLocalDate(task.due, locale)} · {pick(task, "phase")}</span></div>
                <ArrowUpRight size={16} />
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={() => navigate("/employee/tasks")}>{t("view_all_tasks")} <ArrowUpRight size={15} /></Button>
        </Card>
      </div>
      <div className="dashboard-grid lower">
        <Card>
          <SectionHeader title={t("continue_learning")} subtitle={t("learning_subtitle")} />
          <div className="module-list">
            {modules.filter(m => m.progress > 0 && m.progress < 100).map(m => (
              <div className="module-row" key={m.id}>
                <div className="module-icon"><BookOpen size={17} /></div>
                <div className="module-info">
                  <strong>{pick(m, "title")}</strong><span>{t("min_n", { n: m.duration })} · {t("lessons_count", { n: m.lessons })}</span>
                  <ProgressBar value={m.progress} />
                </div>
                <Button variant="secondary" onClick={() => navigate(`/employee/learning/${m.id}`)}>{t("continue")}</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="tip-card">
          <div className="tip-icon">✦</div>
          <span className="eyebrow">{t("ai_learning_tip")}</span>
          <h3>{t("tip_title")}</h3>
          <p>{t("tip_desc")}</p>
          <Button variant="secondary" onClick={() => navigate("/employee/quiz")}>{t("take_quiz")}</Button>
        </Card>
      </div>
    </div>
  );
}
