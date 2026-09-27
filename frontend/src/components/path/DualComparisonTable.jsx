import { useState, useMemo } from "react";
import { Check, X, CircleAlert, ShieldAlert, Award, FileText, ChevronDown, ChevronRight, Layers3 } from "../Icons";
import { Badge, Button, Card, StatCard } from "../UI";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Hiển thị Bảng đối chiếu 2 Pipeline (Dual-Pipeline Comparison View, SRS Step 46, 47 & Table 1).
 * So sánh trường-theo-trường giữa Pipeline 1 (GenAI Output) và Pipeline 2 (Python Ground Truth).
 */
export default function DualComparisonTable({ report }) {
  const { t, tv, locale } = useLanguage();
  const [filterResult, setFilterResult] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});

  if (!report || !report.rows) {
    return (
      <Card>
        <p className="cell-sub" style={{ textAlign: "center", padding: 24 }}>
          {t("comparison_empty_or_loading") || "Đang tải hoặc chưa có dữ liệu đối chiếu 2 Pipeline."}
        </p>
      </Card>
    );
  }

  const { rows, summary, final_verification_status } = report;

  const toggleRow = (reqId) => {
    setExpandedRows(prev => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  const filteredRows = useMemo(() => {
    if (filterResult === "all") return rows;
    return rows.filter(r => {
      if (filterResult === "match") return r.result === "Match";
      if (filterResult === "mismatch") return r.result === "Mismatch";
      if (filterResult === "missing") return r.result === "Missing Requirement";
      if (filterResult === "unsupported") return r.result.includes("Unsupported");
      return true;
    });
  }, [rows, filterResult]);

  const statusTone = {
    "Verified": "green",
    "Verified with Warning": "orange",
    "Incomplete": "red",
    "Unsupported": "red",
    "Contradictory": "red",
    "Manual Review Required": "orange",
  }[final_verification_status] || "blue";

  return (
    <div className="dual-comparison-view">
      {/* 1. Header & Verification Decision */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        padding: "16px 20px",
        background: "var(--surface-elevated, #f8fafc)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--border)",
        marginBottom: 20
      }}>
        <div>
          <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", fontWeight: 700 }}>
            {t("dual_pipeline_decision_title") || "Dual-Pipeline Verification Decision"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              {report.path_title}
            </h2>
            <Badge tone={statusTone} large>
              {final_verification_status}
            </Badge>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Role: <strong>{report.role_name}</strong> · Total Ground-Truth Requirements: <strong>{report.total_requirements}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Mandatory Coverage</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: report.coverage_score === 100 ? "#10b981" : "#f59e0b" }}>
              {report.coverage_score}%
            </div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Traceability</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#6366f1" }}>
              {report.source_traceability_score}%
            </div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Consistency</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0ea5e9" }}>
              {report.requirement_consistency_score}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label={t("stat_matches") || "Khớp hoàn toàn (Matches)"} value={summary.matches} icon={Check} tone="green" />
        <StatCard label={t("stat_mismatches") || "Khác biệt (Mismatches)"} value={summary.mismatches} icon={CircleAlert} tone="orange" />
        <StatCard label={t("stat_missing") || "Bỏ sót (Missing)"} value={summary.missing} icon={X} tone={summary.missing > 0 ? "red" : "default"} />
        <StatCard label={t("stat_unsupported") || "Bịa đặt (Hallucinations)"} value={summary.unsupported} icon={ShieldAlert} tone={summary.unsupported > 0 ? "red" : "default"} />
      </div>

      {/* 3. Filter Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Lọc kết quả:</span>
        <Button variant={filterResult === "all" ? "primary" : "ghost"} size="sm" onClick={() => setFilterResult("all")}>
          Tất cả ({rows.length})
        </Button>
        <Button variant={filterResult === "match" ? "primary" : "ghost"} size="sm" onClick={() => setFilterResult("match")}>
          Khớp ({summary.matches})
        </Button>
        <Button variant={filterResult === "mismatch" ? "primary" : "ghost"} size="sm" onClick={() => setFilterResult("mismatch")}>
          Khác biệt ({summary.mismatches})
        </Button>
        <Button variant={filterResult === "missing" ? "primary" : "ghost"} size="sm" onClick={() => setFilterResult("missing")}>
          Bỏ sót ({summary.missing})
        </Button>
        {summary.unsupported > 0 && (
          <Button variant={filterResult === "unsupported" ? "primary" : "ghost"} size="sm" onClick={() => setFilterResult("unsupported")}>
            Bịa đặt ({summary.unsupported})
          </Button>
        )}
      </div>

      {/* 4. Table 1 (SRS Step 46 & Table 1) */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", background: "var(--table-header, #f1f5f9)" }}>
                <th style={{ padding: "12px 14px" }}>Mã Yêu Cầu</th>
                <th style={{ padding: "12px 14px" }}>Thuộc Tính</th>
                <th style={{ padding: "12px 14px", color: "#6366f1" }}>Pipeline 1 (GenAI Output)</th>
                <th style={{ padding: "12px 14px", color: "#059669" }}>Pipeline 2 (Python Ground Truth)</th>
                <th style={{ padding: "12px 14px", textAlign: "center" }}>Kết Quả Đối Chiếu</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isExpanded = !!expandedRows[row.requirement_id];
                const resultColor = {
                  "Match": { bg: "#ecfdf5", color: "#065f46", text: "Match" },
                  "Mismatch": { bg: "#fffbeb", color: "#92400e", text: "Mismatch" },
                  "Missing Requirement": { bg: "#fef2f2", color: "#991b1b", text: "Missing" },
                  "Unsupported (Hallucination)": { bg: "#faf5ff", color: "#6b21a8", text: "Hallucination" }
                }[row.result] || { bg: "#f3f4f6", color: "#374151", text: row.result };

                return (
                  <tr key={row.requirement_id} style={{ borderBottom: "1px solid var(--border-light, #eee)" }}>
                    {/* Requirement ID */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>
                        {row.requirement_id}
                      </div>
                      <Badge tone={row.mandatory ? "red" : "default"} size="sm">
                        {row.mandatory ? "Mandatory" : "Optional"}
                      </Badge>
                    </td>

                    {/* Attribute Summary */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>
                        {row.python_ground_truth?.text || row.source_document}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Tài liệu: <strong>{row.source_document}</strong> {row.source_section && `§${row.source_section}`}
                      </div>
                      {row.explanation && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 4 }}>
                          {row.explanation}
                        </div>
                      )}
                    </td>

                    {/* GenAI Output */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top", background: "rgba(99, 102, 241, 0.02)" }}>
                      <div>Tài liệu: <strong>{row.genai_output?.document}</strong></div>
                      <div>Mục trích: <strong>{row.genai_output?.section || "—"}</strong></div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        {row.genai_output?.taught ? "✓ Đã đưa vào bài học" : "✕ Chưa dạy"} · {row.genai_output?.assessed ? "✓ Đã có bài test" : "✕ Chưa test"}
                      </div>
                    </td>

                    {/* Python Ground Truth */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top", background: "rgba(16, 185, 129, 0.02)" }}>
                      <div>Tài liệu chuẩn: <strong>{row.python_ground_truth?.document}</strong></div>
                      <div>Mục bắt buộc: <strong>{row.python_ground_truth?.section || "—"}</strong></div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        Ưu tiên: <strong>{row.priority}</strong> · Giai đoạn: <strong>{row.due_stage}</strong>
                      </div>
                    </td>

                    {/* Match/Mismatch Result */}
                    <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: resultColor.bg,
                        color: resultColor.color,
                        fontWeight: 700,
                        fontSize: 12
                      }}>
                        {resultColor.text}
                      </span>
                    </td>

                    {/* Validation Status */}
                    <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top" }}>
                      <Badge tone={
                        row.validation_status === "Verified" ? "green" :
                        row.validation_status === "Verified with Warning" ? "orange" : "red"
                      }>
                        {row.validation_status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
