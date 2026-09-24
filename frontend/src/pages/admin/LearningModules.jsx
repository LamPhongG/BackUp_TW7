import { useState } from "react";
import { BookOpen, Plus, Play } from "../../components/Icons";
import { Card, Badge, Button, Modal, ProgressBar } from "../../components/UI";
import { modules } from "../../data/mock";
import { useDocuments } from "../../contexts/DocumentsContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { ROLES } from "../../data/company";

export default function LearningModules() {
  const [open, setOpen] = useState(false);
  const { t, tv, pick } = useLanguage();
  const { activeDocuments } = useDocuments();
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("content_mgmt_eyebrow")}</span><h1>{t("learning_modules")}</h1><p>{t("admin_modules_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("create_module")}</Button>
      </div>
      <div className="module-grid">
        {modules.map(m => (
          <Card className="module-card" key={m.id}>
            <div className="module-cover">
              <span>{tv(m.category)}</span><BookOpen size={28} />
            </div>
            <div className="module-card-body">
              <Badge tone={m.status === "Completed" ? "green" : m.status === "In Progress" ? "purple" : "default"}>{tv(m.status)}</Badge>
              <h3>{pick(m, "title")}</h3>
              <p>{t("lessons_count", { n: m.lessons })} · {t("min_n", { n: m.duration })}</p>
              <ProgressBar value={m.progress} showValue />
              <small className="source">{t("source_prefix")} {m.source}</small>
              <Button variant="secondary" icon={<Play size={15} />}>{t("preview")}</Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} title={t("create_learning_module")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("module_title")}<input placeholder={t("module_title_placeholder")} /></label>
          <label>{t("category")}<select>{["Company", "Compliance", "Security", "Engineering", "Customer Support"].map(c => <option key={c} value={c}>{tv(c)}</option>)}</select></label>
          <label>{t("job_role")}<select><option value="All roles">{tv("All roles")}</option>{ROLES.map(r => <option key={r.id} value={r.nameEn}>{r.nameEn}</option>)}</select></label>
          <label>{t("source_document")}<select>{activeDocuments.length === 0 ? <option value="">{t("ai_no_sources")}</option> : activeDocuments.map(d => <option key={d.id} value={d.id}>{d.code} · {pick(d, "title")} (v{d.version})</option>)}</select></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("generate_with_ai")}</Button>
        </div>
      </Modal>
    </div>
  );
}
