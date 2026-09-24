import { useState } from "react";
import { ClipboardCheck, Plus, FileText } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button, Modal } from "../../components/UI";
import { quizQuestions } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { ROLES } from "../../data/company";

const quizzes = [
  { id: 1, title: "Bài kiểm tra quy trình kỹ thuật", titleEn: "Engineering workflow quiz", module: "Quy trình bàn giao phần mềm", moduleEn: "Software Deployment Workflow", questions: 3, role: "Software Support Engineer", status: "Published" },
  { id: 2, title: "Đánh giá an toàn thông tin", titleEn: "Information security assessment", module: "An toàn thông tin & Mật khẩu", moduleEn: "Information Security & Passwords", questions: 5, role: "All roles", status: "Published" },
  { id: 3, title: "Kiểm tra văn hóa công ty", titleEn: "Company culture check", module: "Công ty & Văn hóa", moduleEn: "Company & Culture", questions: 4, role: "All roles", status: "Draft" },
];

export default function Quizzes() {
  const [open, setOpen] = useState(false);
  const { t, tv, pick } = useLanguage();
  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">{t("assessments_eyebrow")}</span><h1>{t("menu_quizzes")}</h1><p>{t("quizzes_desc")}</p></div>
        <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>{t("create_quiz")}</Button>
      </div>
      <Card>
        <SectionHeader title={t("all_quizzes")} subtitle={t("all_quizzes_desc")} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("col_quiz")}</th><th>{t("col_source_module")}</th><th>{t("col_questions")}</th><th>{t("col_role")}</th><th>{t("col_status")}</th></tr></thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q.id}>
                  <td><div className="table-primary"><span className="file-icon"><ClipboardCheck size={16} /></span><strong>{pick(q, "title")}</strong></div></td>
                  <td>{pick(q, "module")}</td>
                  <td>{t("questions_count", { n: q.questions })}</td>
                  <td>{tv(q.role)}</td>
                  <td><Badge tone={q.status === "Published" ? "green" : "orange"}>{tv(q.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card style={{ marginTop: 18 }}>
        <SectionHeader title={t("sample_questions")} subtitle={t("sample_questions_desc", { name: pick(quizzes[0], "title") })} />
        {quizQuestions.map((q, i) => (
          <div key={q.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <strong style={{ fontSize: 11 }}>{i + 1}. {pick(q, "question")}</strong>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {pick(q, "options").map((o, j) => (
                <span key={o} style={{ fontSize: 9, padding: "4px 8px", borderRadius: 5, background: j === q.answer ? "var(--green-bg)" : "#f0f2f5", color: j === q.answer ? "var(--green)" : "var(--muted)" }}>{o}</span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "var(--muted)", fontSize: 9 }}>
              <FileText size={11} />{q.source} · {t("page_abbr")}{q.sourceRef.page}
            </div>
          </div>
        ))}
      </Card>
      <Modal open={open} title={t("create_quiz")} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>{t("quiz_title_label")}<input placeholder={t("quiz_title_placeholder")} /></label>
          <label>{t("source_module")}<select>{quizzes.slice(0, 2).map(q => <option key={q.id}>{pick(q, "module")}</option>)}</select></label>
          <label>{t("target_role")}<select><option value="All roles">{tv("All roles")}</option>{ROLES.map(r => <option key={r.id} value={r.nameEn}>{r.nameEn}</option>)}</select></label>
          <label>{t("question_count")}<select>{[5, 10, 20].map(n => <option key={n} value={n}>{t("questions_count", { n })}</option>)}</select></label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={() => setOpen(false)}>{t("generate_quiz")}</Button>
        </div>
      </Modal>
    </div>
  );
}
