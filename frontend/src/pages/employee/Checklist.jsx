import { useState } from "react";
import { Check, LockKeyhole, ChevronDown } from "../../components/Icons";
import { Card, Badge, ProgressBar } from "../../components/UI";
import { phases } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { completedItemCount } from "../../utils/helpers";

export default function Checklist() {
  const [open, setOpen] = useState(1);
  const { t, pick } = useLanguage();

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("checklist_eyebrow")}</span>
          <h1>{t("checklist_title")}</h1>
          <p>{t("checklist_desc")}</p>
        </div>
        <Badge tone="purple">{t("percent_complete", { n: 68 })}</Badge>
      </div>
      <div className="timeline">
        {phases.map((p, i) => (
          <div className={`timeline-item ${p.status}`} key={p.id}>
            <div className="timeline-marker">
              {p.status === "completed" ? <Check size={17} /> : p.status === "locked" ? <LockKeyhole size={15} /> : i + 1}
            </div>
            <Card>
              <button className="timeline-toggle" onClick={() => setOpen(open === p.id ? null : p.id)}>
                <div>
                  <span className="eyebrow">{pick(p, "label")}</span>
                  <h3>{pick(p, "sublabel")}</h3>
                </div>
                <div className="timeline-right">
                  <ProgressBar value={p.progress} />
                  <span style={{ fontSize: 10, color: "var(--muted)", minWidth: 32 }}>{p.progress}%</span>
                  <ChevronDown className={open === p.id ? "rotated" : ""} size={18} />
                </div>
              </button>
              {open === p.id && (
                <div className="timeline-details">
                  {pick(p, "items").map((item, j) => {
                    const done = j < completedItemCount(p);
                    return (
                      <div className="check-row" key={item}>
                        <span className={done ? "checked" : ""}>{done && <Check size={12} />}</span>
                        <label style={{ textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "inherit" }}>{item}</label>
                        <small style={{ color: done ? "var(--green)" : "var(--muted)" }}>{done ? t("done") : t("pending")}</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
