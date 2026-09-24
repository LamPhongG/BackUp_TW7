import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Sparkles, Check, WandSparkles, ArrowRight, Settings, RefreshCw, CircleAlert } from "../../components/Icons";
import { Card, Badge, Button, Modal } from "../../components/UI";
import ValidationTag from "../../components/ValidationTag";
import { SkeletonAIGeneration } from "../../components/SkeletonLoader";
import { aiGeneration, aiComparisonData } from "../../data/mock";
import { ROLES } from "../../data/company";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDocuments } from "../../contexts/DocumentsContext";

export default function AIStudio() {
  // Nguồn Ground Truth = các phiên bản đang hiệu lực trong kho tài liệu
  const { activeDocuments } = useDocuments();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const sources = selectedIds.filter(id => activeDocuments.some(d => d.id === id));
  const [role, setRole] = useState(ROLES[6].nameEn);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { t, tv, pick } = useLanguage();
  // null = người dùng chưa sửa → hiển thị prompt mặc định theo ngôn ngữ hiện tại; sửa rồi thì giữ nguyên nội dung
  const [prompt, setPrompt] = useState(null);

  // Đếm lỗi thực tế từ dữ liệu đối chiếu thay vì hard-code
  const hallucinationCount = aiComparisonData.filter(r => r.status === "hallucination").length;
  const contradictionCount = aiComparisonData.filter(r => r.status === "contradiction").length;

  const toggle = id => setSelectedIds(sources.includes(id) ? sources.filter(x => x !== id) : [...sources, id]);
  
  const generate = () => {
    setGenerating(true);
    setTimeout(() => { 
      setGenerating(false); 
      setGenerated(true); 
    }, 2500);
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("generative_ai_engine")}</span>
          <h1>{t("ai_studio_title")}</h1>
          <p>{t("ai_studio_desc")}</p>
        </div>
        <Badge tone="purple"><Sparkles size={13} /> Gemini 1.5 Pro ({tv("Active")})</Badge>
      </div>

      <div className="ai-studio-grid">
        {/* LỚP CẤU HÌNH AI */}
        <Card>
          <div className="ai-header">
            <div className="ai-icon"><BrainCircuit size={22} /></div>
            <div>
              <h3>{t("config_title")}</h3>
              <p>{t("config_desc")}</p>
            </div>
            <button className="icon-btn" style={{ marginLeft: 'auto' }}><Settings size={18} /></button>
          </div>

          <div className="form-grid" style={{ marginBottom: 20 }}>
            <label>{t("role_position")}<select value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(r => <option key={r.id} value={r.nameEn}>{r.nameEn}</option>)}</select></label>
            <label>{t("skill_level")}<select defaultValue="Intermediate">{["Beginner", "Intermediate", "Advanced"].map(l => <option key={l} value={l}>{tv(l)}</option>)}</select></label>
            <label style={{ gridColumn: '1 / -1' }}>{t("system_prompt")}
              <textarea 
                value={prompt ?? t("ai_default_prompt")}
                onChange={e => setPrompt(e.target.value)}
                style={{ height: 70 }} 
              />
            </label>
          </div>

          <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t("ground_truth_source")}</span>
            <Badge tone="green">{sources.length} {t("docs_selected")}</Badge>
          </div>
          {activeDocuments.length === 0 ? (
            <div className="notice notice--warning" style={{ marginTop: 8 }}>
              <CircleAlert size={16} />
              <span>{t("ai_no_sources")} <button type="button" className="link-btn" onClick={() => navigate("/admin/documents")}>{t("upload_documents")}</button></span>
            </div>
          ) : (
            <div className="source-select">
              {activeDocuments.map(d => (
                <button className={sources.includes(d.id) ? "selected" : ""} onClick={() => toggle(d.id)} key={d.id}>
                  <span>{sources.includes(d.id) && <Check size={13} />}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'inherit', border: 'none', padding: 0, height: 'auto', background: 'transparent' }}>{d.code} · {pick(d, "title")}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, border: 'none', padding: 0, height: 'auto', background: 'transparent' }}>{tv(d.category)} · v{d.version}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Button 
            onClick={generate} 
            disabled={generating || sources.length === 0} 
            icon={generating ? <RefreshCw className="spin" size={16} /> : <WandSparkles size={16} />}
            style={{ width: '100%', marginTop: 10, height: 44, fontSize: 14 }}
          >
            {generating ? t("generating_btn") : t("generate_btn")}
          </Button>
        </Card>

        {/* LỚP OUTPUT & KIỂM ĐỊNH */}
        <Card className="ai-preview" style={{ display: 'flex', flexDirection: 'column' }}>
          {!generated && !generating ? (
            <div className="ai-empty" style={{ margin: 'auto' }}>
              <div className="ai-orb"><Sparkles size={28} /></div>
              <h3>{t("empty_result_title")}</h3>
              <p>{t("empty_result_desc")}</p>
              <div className="ai-flow" style={{ marginTop: 30 }}>
                <span>Skill Gap</span><ArrowRight size={14} /><span>Ground Truth</span><ArrowRight size={14} /><span>AI Gen</span><ArrowRight size={14} /><span>Validation</span>
              </div>
            </div>
          ) : generating ? (
            <div style={{ padding: 20 }}>
              <SkeletonAIGeneration />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="card-title-row">
                <div>
                  <span className="eyebrow">{t("ai_draft_title")} ({role})</span>
                  <h3 style={{ margin: "5px 0" }}>{t("personalized_onboarding")}</h3>
                </div>
                <Badge tone="orange">{t("needs_review")}</Badge>
              </div>

              <div className="generated-stats" style={{ margin: "16px 0" }}>
                <div><strong>5</strong><span>{t("stages")}</span></div>
                <div><strong>8</strong><span>{t("study_modules")}</span></div>
                <div><strong>15</strong><span>{t("tasks")}</span></div>
                <div><strong>30</strong><span>{t("quiz_questions")}</span></div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 12, flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 12, color: 'var(--muted)' }}>{t("structure_summary")}:</h4>
                <div className="generated-plan">
                  {aiGeneration.plan.map(p => (
                    <div key={p.phase} style={{ display: 'flex', justifyContent: 'space-between', padding: "8px 0", borderBottom: "1px solid #f0f2f5" }}>
                      <strong style={{ fontSize: 12 }}>{pick(p, "phase")}</strong>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t("items_count", { n: p.items })} {t("plan_note")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--orange-bg)', padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--orange)', fontSize: 11 }}>
                  <CircleAlert size={14} />
                  <span>{t("detect_summary", { h: hallucinationCount, c: contradictionCount })}</span>
                </div>
                <Button variant="secondary" onClick={() => setShowComparison(true)} style={{ height: 28, fontSize: 10, padding: "0 10px" }}>
                  {t("compare_btn")}
                </Button>
              </div>

              <div className="review-actions">
                <Button variant="secondary">{t("manual_edit")}</Button>
                <Button>{t("approve_assign")}</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* BẢNG SO SÁNH SIDE-BY-SIDE */}
      <Modal open={showComparison} title={t("cross_check_title")} onClose={() => setShowComparison(false)} width="900px">
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          {t("cross_check_desc")}
        </p>
        <div className="table-wrap">
          <table style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>{t("col_field")}</th>
                <th style={{ width: '30%' }}>{t("col_genai")}</th>
                <th style={{ width: '30%' }}>{t("col_ground_truth")}</th>
                <th style={{ width: '15%' }}>{t("col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {aiComparisonData.map(row => (
                <tr key={row.id} style={{ background: row.status === 'hallucination' || row.status === 'contradiction' ? 'var(--red-bg)' : 'transparent' }}>
                  <td>
                    <strong style={{ fontSize: 11 }}>{pick(row, "field")}</strong>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>{t("source_prefix")} {row.sourceRef.doc}</div>
                  </td>
                  <td style={{ fontSize: 11, color: row.status === 'contradiction' ? 'var(--red)' : 'inherit' }}>{pick(row, "genaiOutput")}</td>
                  <td style={{ fontSize: 11 }}>{pick(row, "groundTruth")}</td>
                  <td><ValidationTag status={row.status} showLabel={false} /> <span style={{ fontSize: 10 }}>{
                    row.status === 'verified' ? t("status_match") : 
                    row.status === 'hallucination' ? t("status_hallucination") : 
                    row.status === 'contradiction' ? t("status_contradict") : t("status_warning")
                  }</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <Button variant="secondary" onClick={() => setShowComparison(false)}>{t("close")}</Button>
          <Button>{t("regen_btn")}</Button>
        </div>
      </Modal>
    </div>
  );
}
