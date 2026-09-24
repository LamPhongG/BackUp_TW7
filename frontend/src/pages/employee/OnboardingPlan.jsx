import { useState } from "react";
import MultiStageTimeline from "../../components/MultiStageTimeline";
import { phases } from "../../data/mock";
import { Card, Button, Badge } from "../../components/UI";
import { CalendarDays, ArrowRight } from "../../components/Icons";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { completedItemCount } from "../../utils/helpers";

export default function OnboardingPlan() {
  const [activeStage, setActiveStage] = useState(phases.find(p => p.status === "active") || phases[0]);
  const { t, tv, pick } = useLanguage();
  const { user } = useAuth();

  const items = pick(activeStage, "items") || [];
  const doneCount = completedItemCount(activeStage);
  // Tách câu quanh {prereq} để in đậm điều kiện mà vẫn đúng trật tự từ của từng ngôn ngữ
  const [lockedBefore, lockedAfter = ""] = t("stage_locked_desc").split("{prereq}");

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("plan_eyebrow")}</span>
          <h1>{t("plan_title")}</h1>
          <p>{t("plan_desc", { role: user?.role || "Software Support Engineer" })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Badge tone="purple">{t("level_badge", { level: tv(user?.level || "Intermediate") })}</Badge>
          <Badge tone="green">{t("skipped_git_badge")}</Badge>
        </div>
      </div>

      <div className="detail-layout" style={{ gridTemplateColumns: "1.2fr 1.8fr" }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 14, border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 16, margin: "0 0 20px" }}>{t("milestones_title")}</h3>
          {/* Tích hợp Component Multi-Stage Timeline */}
          <MultiStageTimeline stages={phases} onStageClick={setActiveStage} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: 'linear-gradient(145deg, #12182b, #242b42)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 10, color: '#909cba', textTransform: 'uppercase', letterSpacing: 1 }}>{pick(activeStage, "label")}</span>
                <h2 style={{ margin: "5px 0 10px", fontSize: 24 }}>{pick(activeStage, "sublabel")}</h2>
                <p style={{ color: '#b9c0d1', fontSize: 13, margin: 0 }}>{t("stage_hint")}</p>
              </div>
              <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
                <CalendarDays size={24} color="#fff" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-title-row" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16 }}>{t("tasks_and_courses", { n: items.length })}</h3>
              {activeStage.status === "active" && <Badge tone="purple">{t("percent_complete", { n: activeStage.progress })}</Badge>}
            </div>

            {activeStage.status === "locked" ? (
              <div className="empty-state" style={{ padding: "40px 20px", background: '#f8f9fa', borderRadius: 10 }}>
                <div className="empty-icon" style={{ background: 'transparent', border: '1px dashed #d1d5db', color: '#9ca3af' }}>🔒</div>
                <h3>{t("stage_locked_title")}</h3>
                <p>{lockedBefore}<strong>{pick(activeStage, "prerequisite")}</strong>{lockedAfter}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item, index) => {
                  const done = index < doneCount;
                  return (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: done ? '#f8fafc' : '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center', background: done ? 'var(--green)' : '#f1f5f9', color: done ? '#fff' : '#94a3b8' }}>
                          {done ? "✓" : index + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--muted)' : 'inherit', textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                      </div>
                      {!done && (
                        <Button variant="ghost" style={{ padding: "0 10px", height: 30, fontSize: 11 }}>
                          {t("start")} <ArrowRight size={12} style={{ marginLeft: 4 }} />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
