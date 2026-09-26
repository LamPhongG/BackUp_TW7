import { useNavigate } from "react-router-dom";
import { RouteIcon, BookOpen, CheckSquare, ClipboardCheck, ArrowUpRight, Play, CircleCheck, Compass } from "../../components/Icons";
import { Card, SectionHeader, StatCard, Button, ProgressBar, Badge, EmptyState } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { useEnrollment } from "../../contexts/EnrollmentContext";
import { useAuth } from "../../hooks/useAuth";
import { useMyPaths } from "../../hooks/useMyPaths";
import { usePaths } from "../../contexts/PathsContext";
import { bestAttempt, moduleProgress, nextModule, pathProgress } from "../../utils/progress";
import { backendEnabled } from "../../services/apiClient";
import { formatLocalDate } from "../../utils/helpers";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { t, tv, pick, locale } = useLanguage();
  const { user } = useAuth();
  const { enrollmentFor } = useEnrollment();
  const myPaths = useMyPaths();
  const { loaded } = usePaths();

  let modulesDone = 0, modulesTotal = 0, tasksDone = 0, tasksTotal = 0;
  const scores = [];
  for (const p of myPaths) {
    const e = enrollmentFor(p.id);
    for (const s of p.stages) {
      for (const m of s.modules) {
        const mp = moduleProgress(m, e);
        modulesTotal++;
        if (mp.complete) modulesDone++;
        tasksDone += mp.tasksDone;
        tasksTotal += m.tasks.length;
        const best = bestAttempt(e, m.id);
        if (best) scores.push(best.score / best.total);
      }
    }
  }
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : null;

  // Chưa xong lên trước, rồi theo hạn gần nhất; lộ trình không có hạn (tự chọn) xếp sau
  const learning = myPaths.map(p => ({ p, e: enrollmentFor(p.id) })).map(x => ({ ...x, prog: pathProgress(x.p, x.e) }))
    .sort((a, b) => (a.prog.complete - b.prog.complete) || (a.e.dueDate || "9999").localeCompare(b.e.dueDate || "9999"));
  const date = iso => formatLocalDate(iso, locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const exploreButton = backendEnabled() && (
    <Button variant="secondary" icon={<Compass size={15} />} onClick={() => navigate("/employee/explore")}>{t("explore_more")}</Button>
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("role_employee")} · {tv(user.department)}</span>
          <h1>{t("dashboard_greeting", { name: user.name.split(" ")[0] })}</h1>
          <p>{t("employee_dashboard_desc", { role: user.role })}</p>
        </div>
        <div className="heading-actions">{exploreButton}</div>
      </div>

      <div className="stat-grid">
        <StatCard label={t("my_paths_count")} value={myPaths.length} icon={RouteIcon} tone="purple" />
        <StatCard label={t("modules_done")} value={`${modulesDone} / ${modulesTotal}`} icon={BookOpen} tone="blue" />
        <StatCard label={t("tasks_completed")} value={`${tasksDone} / ${tasksTotal}`} icon={CheckSquare} tone="green" />
        <StatCard label={t("quiz_average")} value={avg == null ? "—" : `${avg}%`} icon={ClipboardCheck} tone="orange" />
      </div>

      {!loaded ? (
        <Card><p className="cell-sub">{t("explore_loading")}</p></Card>
      ) : myPaths.length === 0 ? (
        <Card><EmptyState title={t("no_assigned_paths")} description={t("no_assigned_paths_desc", { department: tv(user.department) })} action={exploreButton} /></Card>
      ) : (
        <Card>
          <SectionHeader title={t("learning_now")} subtitle={t("learning_now_desc")} />
          <div className="module-list">
            {learning.map(({ p, e, prog }) => {
              const next = nextModule(p, e);
              return (
                <div className="module-row" key={p.id}>
                  <div className="module-icon">{prog.complete ? <CircleCheck size={17} /> : <RouteIcon size={17} />}</div>
                  <div className="module-info">
                    <strong>{pick(p, "title")} {e.source === "self" && <Badge tone="blue">{t("explore_status_self")}</Badge>}</strong>
                    <span>{next ? t("next_up", { stage: t(`stage_${next.stage.key}`), module: pick(next.module, "title") }) : t("path_completed")}</span>
                    {e.dueDate && !prog.complete && (
                      <span className={`learning-due ${e.overdue ? "is-overdue" : ""}`}>
                        {t(e.overdue ? "due_overdue" : "due_on", { date: date(e.dueDate) })}
                      </span>
                    )}
                    <ProgressBar value={prog.percent} showValue />
                  </div>
                  {prog.complete ? <Badge tone="green">{t("completed")}</Badge> : (
                    <Button variant="secondary" icon={<Play size={14} />}
                      onClick={() => navigate(next ? `/employee/paths/${p.id}/modules/${next.module.id}` : `/employee/paths/${p.id}`)}>
                      {e.startedAt ? t("continue_learning_btn") : t("start_learning")}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => navigate(`/employee/paths/${p.id}`)}><ArrowUpRight size={15} /></Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
