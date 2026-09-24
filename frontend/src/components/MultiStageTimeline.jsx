import { Check, LockKeyhole, CircleCheck, CircleAlert } from "./Icons";
import { useLanguage } from "../contexts/LanguageContext";
import { completedItemCount } from "../utils/helpers";

/**
 * MultiStageTimeline — Thanh tiến độ đa giai đoạn
 * Hiển thị lộ trình onboarding theo mốc thời gian với 3 trạng thái:
 *  - completed: Đã hoàn thành
 *  - active:    Đang học
 *  - locked:    Chưa mở khóa (do vướng điều kiện tiên quyết)
 */

const STAGE_ICONS = {
  completed: <CircleCheck size={14} />,
  active: null,       // hiển thị số thứ tự
  locked: <LockKeyhole size={12} />,
};

// Key trong locales cho từng trạng thái
const STAGE_LABEL_KEYS = {
  completed: "completed",
  active: "in_progress",
  locked: "locked",
};

export default function MultiStageTimeline({ stages = [], onStageClick }) {
  const { t, pick } = useLanguage();
  return (
    <div className="mst">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const label = pick(stage, "label");
        const statusLabel = t(STAGE_LABEL_KEYS[stage.status]);
        const items = pick(stage, "items") || [];
        const doneCount = completedItemCount(stage);
        return (
          <div key={stage.id} className={`mst__item mst__item--${stage.status}`}>
            {/* Connector line */}
            {!isLast && <div className={`mst__connector mst__connector--${stages[i + 1]?.status === "completed" || stage.status === "completed" ? "done" : "pending"}`} />}

            {/* Marker */}
            <button
              className={`mst__marker mst__marker--${stage.status}`}
              onClick={() => onStageClick?.(stage)}
              disabled={stage.status === "locked"}
              title={`${label} — ${statusLabel}`}
            >
              {stage.status === "completed"
                ? STAGE_ICONS.completed
                : stage.status === "locked"
                  ? STAGE_ICONS.locked
                  : <span>{i + 1}</span>}
            </button>

            {/* Content */}
            <div className="mst__content">
              <div className="mst__header">
                <strong className="mst__label">{label}</strong>
                <span className={`mst__status-dot mst__status-dot--${stage.status}`}>
                  {statusLabel}
                </span>
              </div>
              <span className="mst__sublabel">{pick(stage, "sublabel")}</span>

              {/* Progress bar — chỉ hiện cho active & completed */}
              {stage.status !== "locked" && (
                <div className="mst__progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${stage.progress ?? 0}%`,
                        background: stage.status === "completed"
                          ? "var(--green)"
                          : "linear-gradient(90deg,var(--primary),#8d83f6)"
                      }}
                    />
                  </div>
                  <span className="mst__pct">{stage.progress ?? 0}%</span>
                </div>
              )}

              {/* Prerequisite note */}
              {stage.status === "locked" && stage.prerequisite && (
                <div className="mst__prereq">
                  <CircleAlert size={11} />
                  <span>{t("requires_completion")} <em>{pick(stage, "prerequisite")}</em></span>
                </div>
              )}

              {/* Items list (expandable) */}
              {items.length > 0 && stage.status !== "locked" && (
                <div className="mst__items">
                  {items.map((item, j) => {
                    const done = j < doneCount;
                    return (
                      <div key={item} className="mst__item-row">
                        <span className={`mst__check ${done ? "mst__check--done" : ""}`}>
                          {done && <Check size={10} />}
                        </span>
                        <span className={done ? "mst__item-done" : ""}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

