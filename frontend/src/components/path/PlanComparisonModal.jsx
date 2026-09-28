import { useState, useMemo } from "react";
import {
  Layers3, Check, X, CircleAlert, Sparkles, FileText, ArrowRight,
  SlidersHorizontal, Award, BookOpen, Clock, Target
} from "../Icons";
import { Modal, Button, Badge, Card, StatCard } from "../UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePaths } from "../../contexts/PathsContext";
import { ROLES as JOB_ROLES } from "../../data/company";
import { PathStatusBadge } from "./Badges";

/**
 * Modal So sánh Lộ trình học (Training Plan Comparison View - SRS Step 60).
 * Cho phép HR / Reviewer so sánh trực quan 2 lộ trình hoặc 2 phiên bản cạnh nhau:
 * Thời lượng, modules, bài tập, câu hỏi đánh giá, tài liệu đối chiếu và độ phủ kỹ năng.
 */
export default function PlanComparisonModal({ open, onClose, defaultPathAId, defaultPathBId }) {
  const { t, tv, pick, locale } = useLanguage();
  const { paths } = usePaths();

  const [pathAId, setPathAId] = useState(defaultPathAId || paths[0]?.id || "");
  const [pathBId, setPathBId] = useState(defaultPathBId || paths[1]?.id || paths[0]?.id || "");

  const pathA = useMemo(() => paths.find(p => p.id === pathAId) || paths[0], [paths, pathAId]);
  const pathB = useMemo(() => paths.find(p => p.id === pathBId) || paths[1] || paths[0], [paths, pathBId]);

  if (!open || !pathA || !pathB) return null;

  // Trích xuất số liệu thống kê của từng Lộ trình
  const statsA = {
    stagesCount: (pathA.stages || []).length,
    modulesCount: (pathA.stages || []).reduce((acc, s) => acc + (s.modules || []).length, 0),
    lessonsCount: (pathA.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.lessons || []).length, 0), 0),
    tasksCount: (pathA.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.tasks || []).length, 0), 0),
    quizzesCount: (pathA.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.quiz || []).length, 0), 0),
    sourcesCount: (pathA.sources || []).length,
    coverage: pathA.coverage?.score != null ? Math.round(pathA.coverage.score * 100) : null,
  };

  const statsB = {
    stagesCount: (pathB.stages || []).length,
    modulesCount: (pathB.stages || []).reduce((acc, s) => acc + (s.modules || []).length, 0),
    lessonsCount: (pathB.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.lessons || []).length, 0), 0),
    tasksCount: (pathB.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.tasks || []).length, 0), 0),
    quizzesCount: (pathB.stages || []).reduce((acc, s) => acc + (s.modules || []).reduce((n, m) => n + (m.quiz || []).length, 0), 0),
    sourcesCount: (pathB.sources || []).length,
    coverage: pathB.coverage?.score != null ? Math.round(pathB.coverage.score * 100) : null,
  };

  const roleA = JOB_ROLES.find(r => r.id === pathA.target?.role_id);
  const roleB = JOB_ROLES.find(r => r.id === pathB.target?.role_id);

  const diffLabel = (valA, valB, suffix = "") => {
    const diff = valA - valB;
    if (diff === 0) return <span style={{ color: "var(--muted)" }}>Bằng nhau</span>;
    if (diff > 0) return <span style={{ color: "#10b981", fontWeight: 700 }}>A nhiều hơn +{diff}{suffix}</span>;
    return <span style={{ color: "#6366f1", fontWeight: 700 }}>B nhiều hơn +{Math.abs(diff)}{suffix}</span>;
  };

  return (
    <Modal open={open} onClose={onClose} title="So sánh 2 Lộ trình đào tạo (Plan Comparison View)" size="xl">
      <div style={{ padding: "0 4px" }}>
        {/* 1. Header Selector */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          alignItems: "center",
          marginBottom: 20,
          padding: 16,
          background: "var(--surface-elevated, #f8fafc)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border)"
        }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
              Lộ trình A (Chuẩn / Gốc)
            </label>
            <select
              className="input-select"
              value={pathAId}
              onChange={e => setPathAId(e.target.value)}
              style={{ width: "100%", fontWeight: 600 }}
            >
              {paths.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {pick(p, "title")}</option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <Badge tone="purple" large>VS</Badge>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
              Lộ trình B (Đối chiếu)
            </label>
            <select
              className="input-select"
              value={pathBId}
              onChange={e => setPathBId(e.target.value)}
              style={{ width: "100%", fontWeight: 600 }}
            >
              {paths.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {pick(p, "title")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Tổng Học phần</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: "#3b82f6" }}>{statsA.modulesCount}</span> vs <span style={{ color: "#8b5cf6" }}>{statsB.modulesCount}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{diffLabel(statsA.modulesCount, statsB.modulesCount)}</div>
          </div>

          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Nhiệm vụ thực tế</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: "#3b82f6" }}>{statsA.tasksCount}</span> vs <span style={{ color: "#8b5cf6" }}>{statsB.tasksCount}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{diffLabel(statsA.tasksCount, statsB.tasksCount)}</div>
          </div>

          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Câu hỏi Quiz</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: "#3b82f6" }}>{statsA.quizzesCount}</span> vs <span style={{ color: "#8b5cf6" }}>{statsB.quizzesCount}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{diffLabel(statsA.quizzesCount, statsB.quizzesCount)}</div>
          </div>

          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Tài liệu áp dụng</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: "#3b82f6" }}>{statsA.sourcesCount}</span> vs <span style={{ color: "#8b5cf6" }}>{statsB.sourcesCount}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{diffLabel(statsA.sourcesCount, statsB.sourcesCount)}</div>
          </div>

          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Coverage Score</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: "#3b82f6" }}>{statsA.coverage != null ? `${statsA.coverage}%` : "Chưa tính"}</span> vs <span style={{ color: "#8b5cf6" }}>{statsB.coverage != null ? `${statsB.coverage}%` : "Chưa tính"}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{statsA.coverage != null && statsB.coverage != null ? diffLabel(statsA.coverage, statsB.coverage, "%") : ""}</div>
          </div>
        </div>

        {/* 3. Detailed Side-by-Side Comparison Table */}
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Tiêu chí So sánh</th>
                <th style={{ width: "35%", background: "rgba(59, 130, 246, 0.05)" }}>Lộ trình A: {pick(pathA, "title")}</th>
                <th style={{ width: "35%", background: "rgba(139, 92, 246, 0.05)" }}>Lộ trình B: {pick(pathB, "title")}</th>
                <th style={{ width: "15%" }}>Đánh giá khác biệt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Mã & Phiên bản</strong></td>
                <td><code>{pathA.id}</code> (v{pathA.revision || 1})</td>
                <td><code>{pathB.id}</code> (v{pathB.revision || 1})</td>
                <td>{pathA.revision === pathB.revision ? "Cùng phiên bản" : "Khác phiên bản"}</td>
              </tr>
              <tr>
                <td><strong>Vị trí & Phòng ban</strong></td>
                <td>{pick(roleA, "name") || pathA.target?.role_id} · {pathA.target?.department}</td>
                <td>{pick(roleB, "name") || pathB.target?.role_id} · {pathB.target?.department}</td>
                <td>{pathA.target?.role_id === pathB.target?.role_id ? "Cùng vị trí chức danh" : "Khác vị trí chức danh"}</td>
              </tr>
              <tr>
                <td><strong>Cấp độ nhân sự</strong></td>
                <td><Badge tone="purple">{pathA.level || "Standard"}</Badge></td>
                <td><Badge tone="purple">{pathB.level || "Standard"}</Badge></td>
                <td>{pathA.level === pathB.level ? "Tương đương" : "Khác trình độ"}</td>
              </tr>
              <tr>
                <td><strong>Trạng thái Phê duyệt</strong></td>
                <td><PathStatusBadge status={pathA.status} /></td>
                <td><PathStatusBadge status={pathB.status} /></td>
                <td>{pathA.status === pathB.status ? "Đồng nhất trạng thái" : "Khác trạng thái workflow"}</td>
              </tr>
              <tr>
                <td><strong>Công nghệ sinh AI (Engine)</strong></td>
                <td><code>{pathA.engine || "gemini-2.5-flash"}</code></td>
                <td><code>{pathB.engine || "gemini-2.5-flash"}</code></td>
                <td>{pathA.engine === pathB.engine ? "Cùng mô hình AI" : "Khác mô hình AI"}</td>
              </tr>
              <tr>
                <td><strong>Số Giai đoạn (Stages)</strong></td>
                <td><strong>{statsA.stagesCount}</strong> giai đoạn</td>
                <td><strong>{statsB.stagesCount}</strong> giai đoạn</td>
                <td>{diffLabel(statsA.stagesCount, statsB.stagesCount, " giai đoạn")}</td>
              </tr>
              <tr>
                <td><strong>Tổng số Bài học</strong></td>
                <td><strong>{statsA.lessonsCount}</strong> bài học</td>
                <td><strong>{statsB.lessonsCount}</strong> bài học</td>
                <td>{diffLabel(statsA.lessonsCount, statsB.lessonsCount, " bài")}</td>
              </tr>
              <tr>
                <td><strong>Nhiệm vụ Thực hành</strong></td>
                <td><strong>{statsA.tasksCount}</strong> nhiệm vụ</td>
                <td><strong>{statsB.tasksCount}</strong> nhiệm vụ</td>
                <td>{diffLabel(statsA.tasksCount, statsB.tasksCount, " task")}</td>
              </tr>
              <tr>
                <td><strong>Bài kiểm tra Đánh giá</strong></td>
                <td><strong>{statsA.quizzesCount}</strong> câu hỏi trắc nghiệm</td>
                <td><strong>{statsB.quizzesCount}</strong> câu hỏi trắc nghiệm</td>
                <td>{diffLabel(statsA.quizzesCount, statsB.quizzesCount, " câu")}</td>
              </tr>
              <tr>
                <td><strong>Độ phủ Kỹ năng (Ground Truth)</strong></td>
                <td><strong style={{ color: "#10b981" }}>{statsA.coverage != null ? `${statsA.coverage}%` : "Chưa tính"}</strong></td>
                <td><strong style={{ color: "#10b981" }}>{statsB.coverage != null ? `${statsB.coverage}%` : "Chưa tính"}</strong></td>
                <td>{statsA.coverage != null && statsB.coverage != null ? diffLabel(statsA.coverage, statsB.coverage, "%") : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Stage & Module Breakdown Comparison */}
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "16px 0 10px" }}>
          Phân bổ Giai đoạn & Danh mục Học phần
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 8, fontSize: 13 }}>
              Cấu trúc Lộ trình A: {pick(pathA, "title")}
            </div>
            {(pathA.stages || []).map((s, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  {s.name || `Giai đoạn ${idx + 1}`} ({s.duration || "2 tuần"})
                </div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 12.5 }}>
                  {(s.modules || []).map((m, mIdx) => (
                    <li key={mIdx} style={{ margin: "3px 0" }}>
                      <strong>{pick(m, "title")}</strong>
                      <span className="cell-sub" style={{ marginLeft: 6 }}>
                        ({(m.lessons || []).length} bài, {(m.tasks || []).length} task, {(m.quiz || []).length} câu hỏi)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 8, fontSize: 13 }}>
              Cấu trúc Lộ trình B: {pick(pathB, "title")}
            </div>
            {(pathB.stages || []).map((s, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  {s.name || `Giai đoạn ${idx + 1}`} ({s.duration || "2 tuần"})
                </div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 12.5 }}>
                  {(s.modules || []).map((m, mIdx) => (
                    <li key={mIdx} style={{ margin: "3px 0" }}>
                      <strong>{pick(m, "title")}</strong>
                      <span className="cell-sub" style={{ marginLeft: 6 }}>
                        ({(m.lessons || []).length} bài, {(m.tasks || []).length} task, {(m.quiz || []).length} câu hỏi)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <Button variant="primary" onClick={onClose}>
            Đóng bảng so sánh
          </Button>
        </div>
      </div>
    </Modal>
  );
}
