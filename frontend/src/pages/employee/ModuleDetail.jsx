import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Clock3, CheckSquare, FileText } from "../../components/Icons";
import { Card, Badge, ProgressBar } from "../../components/UI";
import SourceBadge from "../../components/SourceBadge";
import { modules } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";

const lessons = [
  { id: 1, title: "Tổng quan về Kiến trúc Microservices", titleEn: "Microservices Architecture Overview", duration: 8, done: true, sourceSection: "§3.1" },
  { id: 2, title: "Convention đặt tên và Cấu trúc thư mục", titleEn: "Naming Convention & Folder Structure", duration: 12, done: true, sourceSection: "§3.2" },
  { id: 3, title: "Quy trình Review Code (SLA)", titleEn: "Code Review Process (SLA)", duration: 7, done: false, sourceSection: "§3.4" },
  { id: 4, title: "Hướng dẫn Deploy qua CI/CD Pipeline", titleEn: "Deploy via CI/CD Pipeline Guide", duration: 15, done: false, sourceSection: "§5.1" }
];

export default function ModuleDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, tv, pick, lang } = useLanguage();
  const module = modules.find(m => m.id === Number(id)) || modules[2];

  return (
    <div>
      <button className="back-btn" onClick={() => nav("/employee/learning")}>
        <ArrowLeft size={16} /> {t("back_to_list")}
      </button>

      <div className="detail-hero">
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <Badge tone="purple">{tv(module.category)}</Badge>
          <Badge tone="default">{t("created_by_ai")}</Badge>
          <SourceBadge 
            doc={module.sourceRef?.doc || module.source} 
            section={module.sourceRef?.section} 
            page={module.sourceRef?.page} 
          />
        </div>
        <h1>{pick(module, "title")}</h1>
        <p>{t("course_desc")}</p>
      </div>

      <div className="detail-layout">
        <div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0e1426', height: 420, display: 'grid', placeItems: 'center', position: 'relative' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                <Play size={28} color="#fff" style={{ marginLeft: 4 }} />
              </div>
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 14 }}>
                <span>00:00 / 07:23</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SourceBadge doc={module.sourceRef?.doc} section={lang === "vi" ? "Video sinh từ text" : "Text-to-Video generation"} inline />
                </span>
              </div>
            </div>
            
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("lesson_content")}: {lang === 'vi' ? 'Quy trình Review Code' : 'Code Review Process'}</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 14 }}>
                {lang === 'vi' 
                  ? "Trong quy trình phát triển, mọi Pull Request (PR) đều phải được review trước khi merge vào nhánh chính. Theo quy định, SLA (Service Level Agreement) cho việc review là phản hồi trong vòng 24 giờ làm việc. Đối với các PR hướng đến môi trường production, bắt buộc phải có ít nhất 2 người phê duyệt (approver)."
                  : "In the development process, every Pull Request (PR) must be reviewed before merging into the main branch. As per the rules, the review SLA (Service Level Agreement) is a response within 24 working hours. For PRs targeting the production environment, at least 2 approvers are required."}
              </p>
              
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, marginTop: 20, borderLeft: '3px solid var(--primary)' }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, color: 'var(--navy)' }}>{t("ai_note")}</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  {lang === 'vi' 
                    ? "Hệ thống nhận thấy bạn đã có kinh nghiệm làm việc với Git, do đó phần hướng dẫn tạo PR cơ bản đã được rút gọn."
                    : "The system detects you already have experience with Git, so the basic PR creation guide has been condensed."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="sticky-card">
            <h3 style={{ margin: "0 0 16px" }}>{t("course_progress")}</h3>
            <ProgressBar value={module.progress} showValue />
            
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}><Clock3 size={14} /> {t("min_n", { n: module.duration })}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}><CheckSquare size={14} /> {lessons.filter(l => l.done).length}/{t("lessons_count", { n: lessons.length })}</div>
            </div>

            <hr />
            
            <div className="lesson-list">
              {lessons.map(l => (
                <div className={`lesson ${l.done ? "done" : ""}`} key={l.id}>
                  <div className="lesson-number">{l.done ? "✓" : l.id}</div>
                  <div>
                    <strong style={{fontSize: 14}}>{pick(l, "title")}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{fontSize: 12}}>{t("min_n", { n: l.duration })}</span>
                      <span style={{ fontSize: 11, color: 'var(--primary)' }} title={`${t("source_prefix")} ${l.sourceSection}`}>
                        <FileText size={10} style={{ marginRight: 2, verticalAlign: 'text-bottom' }} /> 
                        {l.sourceSection}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
